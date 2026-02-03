
import { Application, ApplicationStatus, Job } from "../types";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { generateEmbedding, scoreCandidateProfile } from "./gemini";

// Helper to recursively sanitize objects/arrays for Postgres
// This fixes the "unsupported Unicode escape sequence" error by removing null bytes (\u0000)
// It "adapts" the data to be compatible with Postgres text fields.
const deepSanitize = (input: any): any => {
    if (typeof input === 'string') {
        // Remove null bytes (\u0000), backslashed nulls, and trim whitespace
        // This is the core fix for the user's error.
        return input
            .replace(/\u0000/g, '')
            .replace(/\\u0000/g, '')
            .replace(/\x00/g, '') 
            .trim();
    }
    if (Array.isArray(input)) {
        return input.map(deepSanitize);
    }
    if (input !== null && typeof input === 'object') {
        const out: any = {};
        for (const k in input) {
            out[k] = deepSanitize(input[k]);
        }
        return out;
    }
    return input;
};

export const uploadCVToSupabase = async (file: File): Promise<string> => {
    if (!isSupabaseConfigured) return "";
    // Sanitize filename
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${Date.now()}-${cleanName}`;
    const { data, error } = await supabase.storage.from('CV').upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from('CV').getPublicUrl(fileName);
    return publicUrl;
};

export const getJobs = async (): Promise<Job[]> => {
    if (!isSupabaseConfigured) return [];
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    return data || [];
};

// --- PUBLIC API FUNCTIONS (No Auth Required) ---

export const getPublicJobs = async (): Promise<Job[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('jobs').select('*').order('department');
    if (error) throw new Error(error.message);
    return data || [];
};

export const submitPublicApplication = async (formData: any, cvFile: File): Promise<void> => {
    if (!isSupabaseConfigured) throw new Error("System is offline.");

    // 1. Upload CV
    const cvUrl = await uploadCVToSupabase(cvFile);

    // 2. Fetch Job Details for AI Scoring
    const { data: job } = await supabase.from('jobs').select('*').eq('id', formData.jobId).single();

    // 3. AI Scoring (If Manual Entry)
    let aiMatchScore = 0;
    let aiSummary = formData.ai_summary || 'Manual Entry';

    if (job) {
        try {
            console.log("Scoring Public Candidate via AI...");
            const aiResult = await scoreCandidateProfile(formData, job, 'lo');
            aiMatchScore = aiResult.match_score;
            aiSummary = aiResult.ai_summary;
        } catch (e) {
            console.warn("AI Scoring failed during public submission:", e);
        }
    }

    // 4. Prepare & Sanitize Data
    const candidateId = self.crypto.randomUUID();
    
    // Construct the payload first
    const rawCandidateData = {
        id: candidateId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        village: formData.village,
        district: formData.district,
        province: formData.province,
        expected_salary: formData.expectedSalary,
        resume_url: cvUrl,
        skills: formData.skills || [],
        experience_years: Number(formData.experience_years) || 0,
        age: Number(formData.age) || 0,
        gender: formData.gender || 'Other',
        work_history: formData.work_history || '',
        education: formData.education || '',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.firstName}-${Date.now()}` // Generate Avatar
    };

    // Sanitize EVERYTHING before sending to Postgres
    const candidateData = deepSanitize(rawCandidateData);

    const { error: cErr } = await supabase
        .from('candidates')
        .insert([candidateData]);

    if (cErr) throw new Error("Failed to save candidate: " + cErr.message);

    // 5. Create Application
    const rawAppData = {
        candidate_id: candidateId,
        job_id: formData.jobId,
        status: ApplicationStatus.NEW,
        ai_match_score: aiMatchScore, // Use calculated score
        ai_summary: aiSummary, // Use generated summary
        cv_url: cvUrl,
        applied_at: new Date().toISOString()
    };

    const appData = deepSanitize(rawAppData);

    const { error: aErr } = await supabase
        .from('applications')
        .insert([appData]);

    if (aErr) throw new Error("Failed to submit application: " + aErr.message);
};

// --- END PUBLIC API ---

export const getApplications = async (): Promise<Application[]> => {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
        .from('applications')
        .select(`*, candidate:candidates (*), job:jobs (title)`)
        .eq('is_hidden', false) // ONLY FETCH NON-HIDDEN APPLICATIONS
        .order('applied_at', { ascending: false });
    if (error) return [];
    return data.map((app: any) => ({
        ...app,
        candidate: { ...app.candidate, applied_position: app.job?.title || 'Unknown' }
    })) as any;
};

export const addApplication = async (parsedData: any, jobId: string, cvFile?: File): Promise<Application> => {
    if (!isSupabaseConfigured) throw new Error("Supabase is not connected.");
    
    let cvUrl = "";
    if (cvFile) cvUrl = await uploadCVToSupabase(cvFile);

    // 1. Check if score is missing (Manual Entry Case)
    let aiMatchScore = parseInt(parsedData.match_score) || 0;
    let aiSummary = parsedData.ai_summary || '';

    if (aiMatchScore === 0) {
         const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
         if (job) {
             try {
                 const aiResult = await scoreCandidateProfile(parsedData, job, 'lo');
                 aiMatchScore = aiResult.match_score;
                 aiSummary = aiResult.ai_summary;
             } catch (e) {
                 console.warn("AI Scoring failed during manual add:", e);
             }
         }
    }

    // Generate Embedding for Vector Search
    const textToEmbed = `${Array.isArray(parsedData.skills) ? parsedData.skills.join(' ') : ''} ${parsedData.work_history || ''} ${parsedData.education || ''}`;
    const embedding = await generateEmbedding(textToEmbed);

    // Prepare Candidate Data
    const rawCandidate = {
        first_name: parsedData.first_name, 
        last_name: parsedData.last_name || '', 
        email: parsedData.email, 
        phone: parsedData.phone || '',
        address: parsedData.address || '', 
        expected_salary: parsedData.expected_salary || '',
        gender: parsedData.gender || 'Other', 
        age: parseInt(parsedData.age) || 25,
        experience_years: parseInt(parsedData.experience_years) || 0, 
        work_history: parsedData.work_history || '',
        skills: Array.isArray(parsedData.skills) ? parsedData.skills : [], 
        education: parsedData.education || '',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${parsedData.first_name}-${Date.now()}`,
        embedding: embedding.length > 0 ? embedding : null, 
        resume_url: cvUrl
    };

    const candidatePayload = deepSanitize(rawCandidate);

    const { data: newCandidate, error: cErr } = await supabase
        .from('candidates')
        .insert([candidatePayload]).select().single();

    if (cErr) throw new Error(cErr.message);

    // Prepare Application Data
    const rawApp = {
        candidate_id: newCandidate.id, 
        job_id: jobId, 
        status: ApplicationStatus.NEW,
        ai_match_score: aiMatchScore, 
        ai_summary: aiSummary, 
        cv_url: cvUrl, 
        applied_at: new Date().toISOString()
    };

    const appPayload = deepSanitize(rawApp);

    const { data: newApp, error: aErr } = await supabase
        .from('applications')
        .insert([appPayload]).select(`*, candidate:candidates (*), job:jobs (title)`).single();

    if (aErr) throw new Error(aErr.message);

    return { ...newApp, candidate: { ...newApp.candidate, applied_position: newApp.job?.title } } as any;
};

export const deleteApplication = async (appId: string) => { 
    if (!isSupabaseConfigured) return;
    try {
        console.log("Soft deleting application (DB):", appId);
        
        // SOFT DELETE: Update is_hidden = true instead of deleting
        const { error } = await supabase
            .from('applications')
            .update({ is_hidden: true })
            .eq('id', appId);

        if (error) throw error;
        
    } catch (e) {
        console.warn("Backend soft-delete error:", e);
    }
};

export const updateApplicationStatus = async (id: string, s: ApplicationStatus) => { 
    if (isSupabaseConfigured) await supabase.from('applications').update({ status: s }).eq('id', id); 
};

export const loginUser = async (u: string, p: string) => {
    if (u === 'HRSENGLAO' && p === 'HR-SL-2026') {
        return { id: 'admin-01', username: 'HRSENGLAO', role: 'ADMIN' };
    }
    if (u === 'recruiter' && p === '1234') {
        return { id: 'user-01', username: 'recruiter', role: 'USER' };
    }
    throw new Error("Invalid Credentials");
};

export const updateInterviewDate = async (id: string, date: string, type?: string, location?: string) => { 
    if (isSupabaseConfigured) {
        await supabase
            .from('applications')
            .update({ 
                interview_date: date,
                interview_type: type,
                interview_location: location
            })
            .eq('id', id); 
    }
};

// UPDATED: Now supports saving 'suggestions' (Array) to the DB
export const updateApplicationAI = async (id: string, score: number, summary: string, suggestions?: any[]) => { 
    if (isSupabaseConfigured) {
        const payload: any = { ai_match_score: score, ai_summary: summary };
        if (suggestions) {
            payload.ai_job_suggestions = suggestions;
        }
        const safePayload = deepSanitize(payload);
        await supabase.from('applications').update(safePayload).eq('id', id); 
    }
};

export const updateCandidateProfile = async (appId: string, updatedData: any) => {
    if (!isSupabaseConfigured) return {} as any;
    const { data: app } = await supabase.from('applications').select('candidate_id').eq('id', appId).single();
    
    if (app?.candidate_id && updatedData.candidate) {
        const safeCandidate = deepSanitize(updatedData.candidate);
        await supabase.from('candidates').update(safeCandidate).eq('id', app.candidate_id);
    }
    
    if (updatedData.ai_summary) {
        await supabase.from('applications').update(deepSanitize({ ai_summary: updatedData.ai_summary })).eq('id', appId);
    }

    const { data: fresh } = await supabase.from('applications').select(`*, candidate:candidates (*), job:jobs (title)`).eq('id', appId).single();
    return { ...fresh, candidate: { ...fresh.candidate, applied_position: fresh.job?.title } } as any;
};

// JOB MANAGEMENT FUNCTIONS
export const addNewJob = async (job: Omit<Job, 'id'>): Promise<Job> => {
    if (!isSupabaseConfigured) return { ...job, id: Math.random().toString() } as any;
    const safeJob = deepSanitize(job);
    const { data, error } = await supabase.from('jobs').insert([safeJob]).select().single();
    if (error) throw error;
    return data as Job;
};

export const updateJob = async (id: string, jobData: Partial<Job>): Promise<Job> => {
    if (!isSupabaseConfigured) throw new Error("Supabase not connected");
    const safeJob = deepSanitize(jobData);
    const { data, error } = await supabase.from('jobs').update(safeJob).eq('id', id).select().single();
    if (error) throw error;
    return data as Job;
};

export const deleteJob = async (id: string): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) throw error;
};

export const seedDefaultJobs = async (): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const MOCK_JOBS = [
        { title: 'IT Support', department: 'IT Department', description: 'Tech support.', requirements: ['PC Repair'] },
        { title: 'HR Officer', department: 'HR Department', description: 'HR support.', requirements: ['Admin'] }
    ];
    await supabase.from('jobs').insert(MOCK_JOBS);
};

export const sendNotification = async (id: string, type: 'REJECT' | 'INTERVIEW') => {
    console.log(`[Notification] ${type} sent.`);
};
