
import { GoogleGenAI, Type } from "@google/genai";
import { Job } from "../types";
import { Language } from "../utils/translations";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const CACHE_KEY = 'smart_hr_ai_cache_v2';

// VITE ENV VARIABLE HANDLER
const getApiKey = (): string => {
    // @ts-ignore
    const viteKey = import.meta.env?.VITE_GEMINI_API_KEY;
    if (viteKey) return viteKey;
    
    // Fallback for non-Vite environments
    return process.env.API_KEY || "";
};

const API_KEY = getApiKey();

// Layer 1: Local Storage (Instant Access)
const getLocalCache = (): Record<string, any> => {
    try {
        const saved = localStorage.getItem(CACHE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        return {};
    }
};

const saveToLocalCache = (key: string, data: any) => {
    try {
        const cache = getLocalCache();
        cache[key] = data;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.warn("Local storage error:", e);
    }
};

// Sync check for immediate UI feedback
export const getCachedTranslation = (applicationId: string, language: Language) => {
    const cache = getLocalCache();
    return cache[`${applicationId}-${language}`] || null;
};

// Layer 2: Supabase (Permanent Cloud Storage)
const getDbTranslation = async (applicationId: string, language: Language) => {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase
        .from('candidate_localizations')
        .select('work_history_translated, education_translated, ai_summary_translated')
        .eq('application_id', applicationId)
        .eq('language_code', language)
        .single();
    
    if (data) {
        return {
            work_history: data.work_history_translated,
            education: data.education_translated,
            ai_summary: data.ai_summary_translated
        };
    }
    return null;
};

const saveToDbTranslation = async (applicationId: string, language: Language, data: any) => {
    if (!isSupabaseConfigured) return;
    await supabase.from('candidate_localizations').upsert({
        application_id: applicationId,
        language_code: language,
        work_history_translated: data.work_history,
        education_translated: data.education,
        ai_summary_translated: data.ai_summary
    });
};

export const parseAndScoreCV = async (
  base64File: string, 
  mimeType: string, 
  job: Job,
  language: Language = 'lo'
): Promise<any> => {
  if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const langNames = { lo: 'Lao', en: 'English', th: 'Thai' };
  const targetLang = langNames[language];

  // UPDATED PROMPT: Specific instruction for Address and Experience calculation
  const systemInstruction = `You are an expert HR AI for Senglao Group. 
  Extract detailed candidate data from the CV for the job: ${job.title}.
  
  CRITICAL EXTRACTION RULES:
  1. Address: You MUST extract the full current address. Look in the header, under personal details, or contact info. Return the full string (e.g., "Ban Phonthan, Saysettha, Vientiane"). If only City/Province is found, return that.
  2. Experience Years: Calculate the TOTAL number of years of work experience based on the date ranges in Employment History. Round to 1 decimal place (e.g. 2.5). Return a NUMBER.
  3. Work History: Extract as a structured list.
  4. Education: Extract as a structured list.
  5. Personal: Extract Gender (default Male if unsure), DOB, Nationality.
  6. Salary: Look for "Expected Salary".
  
  Return valid JSON in ${targetLang}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64File } },
          { text: `Parse this CV. Ensure 'address' and 'experience_years' are populated.` }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            first_name: { type: Type.STRING },
            last_name: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            gender: { type: Type.STRING },
            age: { type: Type.NUMBER },
            dob: { type: Type.STRING, description: "YYYY-MM-DD" },
            nationality: { type: Type.STRING },
            family_status: { type: Type.STRING },
            
            // Critical Fields
            experience_years: { type: Type.NUMBER, description: "Calculated total years of experience" },
            address: { type: Type.STRING, description: "Full address string" },
            
            expected_salary: { type: Type.STRING },
            
            // Arrays
            education_list: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        level: { type: Type.STRING },
                        institution: { type: Type.STRING },
                        year: { type: Type.STRING },
                        major: { type: Type.STRING }
                    }
                }
            },
            employment_list: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        company: { type: Type.STRING },
                        position: { type: Type.STRING },
                        period: { type: Type.STRING },
                        salary: { type: Type.STRING }
                    }
                }
            },
            
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            match_score: { type: Type.NUMBER },
            ai_summary: { type: Type.STRING }
          },
          required: ["first_name", "match_score", "ai_summary"]
        }
      },
    });

    const rawText = response.text || "{}";
    
    // CLEANING STEP: Remove Null Bytes (\u0000) that cause Postgres errors
    const cleanText = rawText
        .replace(/\u0000/g, '')
        .replace(/\\u0000/g, '')
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
    
    let parsedData;
    try {
        parsedData = JSON.parse(cleanText);
    } catch (e) {
        console.warn("JSON Parse Error, attempting partial recovery", e);
        parsedData = {};
    }

    // Post-process arrays to strings for the UI TextAreas
    let eduString = "";
    if (parsedData.education_list && Array.isArray(parsedData.education_list)) {
        eduString = parsedData.education_list.map((e: any) => 
            `• ${e.year || ''} ${e.level || ''} ${e.major ? 'in ' + e.major : ''} ${e.institution ? 'at ' + e.institution : ''}`
        ).join('\n');
    }

    let workString = "";
    if (parsedData.employment_list && Array.isArray(parsedData.employment_list)) {
        workString = parsedData.employment_list.map((e: any) => 
            `• ${e.period || ''}: ${e.position || ''} at ${e.company || ''}`
        ).join('\n');
    }

    // Normalize Gender
    let cleanGender = parsedData.gender || 'Male';
    if (cleanGender.toLowerCase().includes('female') || cleanGender.toLowerCase().includes('ຍິງ')) cleanGender = 'Female';
    else if (cleanGender.toLowerCase().includes('male') || cleanGender.toLowerCase().includes('ຊາຍ')) cleanGender = 'Male';

    return {
        ...parsedData,
        education: eduString || parsedData.education || "",
        work_history: workString || parsedData.work_history || "",
        gender: cleanGender,
        address: parsedData.address || "", // Ensure address is passed
        experience_years: parsedData.experience_years || 0 // Ensure experience is passed
    };

  } catch (error) {
    console.error("AI Parse Error", error);
    throw new Error("AI Analysis failed. Please check your API Key.");
  }
};

// NEW FUNCTION: Score Candidate based on Manual Data
export const scoreCandidateProfile = async (
    candidateData: any, 
    job: Job,
    language: Language = 'lo'
): Promise<{ match_score: number, ai_summary: string }> => {
    if (!API_KEY) return { match_score: 0, ai_summary: "AI Error: Missing API Key" };

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `
    Role: Expert HR Recruiter.
    Task: Evaluate this Candidate Profile against the Job Description.
    
    Job Title: ${job.title}
    Job Department: ${job.department}
    Job Requirements: ${job.requirements.join(', ')}
    Job Description: ${job.description}

    Candidate Profile:
    - Skills: ${Array.isArray(candidateData.skills) ? candidateData.skills.join(', ') : candidateData.skills}
    - Education: ${candidateData.education}
    - Experience: ${candidateData.work_history}
    - Years of Exp: ${candidateData.experience_years}

    Instructions:
    1. Calculate a 'match_score' (0-100) based on how well the candidate fits the job.
    2. Write a professional 'ai_summary' (Executive Summary) in ${language === 'lo' ? 'Lao' : 'English'} explaining the strengths and weaknesses.
    
    Return JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        match_score: { type: Type.NUMBER },
                        ai_summary: { type: Type.STRING }
                    },
                    required: ["match_score", "ai_summary"]
                }
            }
        });

        const result = JSON.parse(response.text || "{}");
        return {
            match_score: result.match_score || 0,
            ai_summary: result.ai_summary || "Manual Entry Submitted."
        };
    } catch (e) {
        console.error("AI Scoring Failed", e);
        return { match_score: 0, ai_summary: "Manual Entry (AI Scoring Failed)" };
    }
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
    if (!API_KEY) return [];
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const result = await ai.models.embedContent({
            model: "text-embedding-004",
            content: { parts: [{ text: text.replace(/\u0000/g, '') }] } // Clean null bytes here too
        });
        return result.embedding?.values || [];
    } catch (e) {
        console.warn("Embedding generation failed:", e);
        return [];
    }
}

export const translateCandidateData = async (applicationId: string, data: any, aiSummary: string, targetLanguage: Language): Promise<any> => {
    const cacheKey = `${applicationId}-${targetLanguage}`;
    const localCached = getCachedTranslation(applicationId, targetLanguage);
    if (localCached) return localCached;

    const dbCached = await getDbTranslation(applicationId, targetLanguage);
    if (dbCached) {
        saveToLocalCache(cacheKey, dbCached);
        return dbCached;
    }

    if (!API_KEY) return { work_history: data.work_history, education: data.education, ai_summary: aiSummary };
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    try {
        // Detect if aiSummary is just "Manual Entry Data"
        const isManualData = aiSummary && (aiSummary.includes("Manual Entry Data") || aiSummary.includes("Extra Details"));
        
        let promptText = "";
        if (isManualData) {
            // FORCE NEW ANALYSIS based on raw data
            promptText = `
            You are an expert HR Analyst. The user manually entered the following raw data.
            
            TASK:
            1. Translate 'work_history' and 'education' into ${targetLanguage}.
            2. IGNORE the current 'ai_summary' which contains raw metadata.
            3. GENERATE A NEW Professional Executive Summary (ai_summary) in ${targetLanguage}. Analyze the candidate's strengths based on their Work History and Skills provided below.
            
            Raw Data:
            ${JSON.stringify({ work_history: data.work_history, education: data.education, skills: data.skills || [] })}
            
            Return JSON only.
            `;
        } else {
            // Standard Localization
            promptText = `
            Localize this CV data into ${targetLanguage}. 
            1. Translate 'work_history', 'education', and 'ai_summary'.
            2. Keep formatting (bullet points).
            
            Data:
            ${JSON.stringify({ work_history: data.work_history, education: data.education, ai_summary: aiSummary })}
            
            Return JSON only.
            `;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { 
                parts: [{ text: promptText.replace(/\u0000/g, '') }] 
            },
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        work_history: { type: Type.STRING },
                        education: { type: Type.STRING },
                        ai_summary: { type: Type.STRING }
                    }
                }
            }
        });
        
        const translatedResult = JSON.parse(response.text || "{}");
        
        // Clean up result just in case
        if (translatedResult.work_history) translatedResult.work_history = translatedResult.work_history.replace(/\u0000/g, '');
        if (translatedResult.ai_summary) translatedResult.ai_summary = translatedResult.ai_summary.replace(/\u0000/g, '');

        saveToLocalCache(cacheKey, translatedResult);
        await saveToDbTranslation(applicationId, targetLanguage, translatedResult);
        return translatedResult;
    } catch (e) { 
        console.error("Translation/Analysis failed", e);
        return { work_history: data.work_history, education: data.education, ai_summary: aiSummary }; 
    }
};

export const analyzeJobSuitability = async (candidate: any, allJobs: Job[], language: Language): Promise<any[]> => {
    if (!API_KEY) return [];

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Prepare minimized job data to reduce token usage
    const jobsData = allJobs.map(j => ({ id: j.id, title: j.title, dept: j.department, reqs: j.requirements }));
    
    // Prepare candidate skills/history summary
    const candidateSummary = {
        skills: candidate.skills || [],
        history: candidate.work_history || "",
        edu: candidate.education || ""
    };

    const prompt = `
    Role: Expert HR Recruiter.
    Task: Compare this Candidate Profile against the list of Available Jobs.
    
    Input:
    1. Candidate Profile: ${JSON.stringify(candidateSummary)}
    2. Available Jobs: ${JSON.stringify(jobsData)}
    
    Instruction:
    - Identify the TOP 3 jobs that best match this candidate.
    - If no strong match, suggest the closest ones but with lower scores.
    - Provide a 'reason' in ${language === 'lo' ? 'Lao' : language === 'th' ? 'Thai' : 'English'}.
    - Return JSON Array.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            jobId: { type: Type.STRING },
                            title: { type: Type.STRING },
                            matchScore: { type: Type.NUMBER, description: "0-100" },
                            reason: { type: Type.STRING, description: "Why this fits" }
                        }
                    }
                }
            }
        });

        const suggestions = JSON.parse(response.text || "[]");
        return suggestions;
    } catch (e) {
        console.error("Job Suitability Analysis Failed", e);
        return [];
    }
};

// NEW FUNCTION: Generate Interview Message
export const generateInterviewMessage = async (
    candidateName: string,
    jobTitle: string,
    dateTime: string,
    type: 'ONLINE' | 'ONSITE',
    location: string,
    language: Language = 'lo'
): Promise<string> => {
    if (!API_KEY) return "Error: API Key missing.";

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const formattedDate = new Date(dateTime).toLocaleString(language === 'lo' ? 'lo-LA' : 'en-US', { dateStyle: 'full', timeStyle: 'short' });

    const prompt = `
    Role: Professional HR Assistant for "Senglao Group".
    Task: Write a polite and professional interview invitation message in ${language === 'lo' ? 'Lao Language' : 'English'}.
    
    Context:
    - Candidate: ${candidateName}
    - Job: ${jobTitle}
    - Time: ${formattedDate}
    - Type: ${type === 'ONLINE' ? 'Online Interview' : 'Face-to-Face Interview'}
    - Location/Link: ${location}
    
    Requirements:
    - Tone: Professional, welcoming, and clear.
    - Include: All details above.
    - Output: Just the message body text. No preamble.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] }
        });
        return response.text?.trim() || "Message generation failed.";
    } catch (e) {
        console.error(e);
        return `Dear ${candidateName}, you are invited for an interview for ${jobTitle} on ${formattedDate}. Location: ${location}`;
    }
}

export const generateInterviewQuestions = async (candidate: any, job: Job, language: Language = 'lo'): Promise<string[]> => {
    return [];
};
