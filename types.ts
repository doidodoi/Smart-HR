
export enum ApplicationStatus {
  NEW = 'NEW',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'USER';
}

export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string; // Auto-generated in DB
  email: string;
  phone: string;
  address?: string; // New Field
  gender?: 'Male' | 'Female' | 'Other';
  age?: number; 
  experience_years: number;
  work_history?: string;
  skills: string[];
  education: string;
  applied_position: string;
  avatar_url?: string;
  resume_url?: string;
  raw_text?: string; // Extracted PDF text
  embedding?: number[]; // Vector embedding
}

export interface JobSuggestion {
  jobId: string;
  title: string;
  matchScore: number;
  reason: string;
}

export interface Application {
  id: string;
  candidate_id: string;
  candidate: Candidate;
  job_id: string;
  status: ApplicationStatus;
  ai_match_score: number;
  ai_summary: string;
  ai_job_suggestions?: JobSuggestion[]; // New Field for persistent storage
  applied_at: string;
  updated_at?: string;
  
  // Interview Details
  interview_date?: string;
  interview_type?: 'ONLINE' | 'ONSITE';
  interview_location?: string;
  
  cv_url?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  embedding?: number[]; // Vector embedding
}

export const STATUS_LABELS: Record<ApplicationStatus, { color: string }> = {
  [ApplicationStatus.NEW]: { color: 'bg-blue-100 text-blue-700 border-blue-200' },
  [ApplicationStatus.SCREENING]: { color: 'bg-amber-100 text-amber-700 border-amber-200' },
  [ApplicationStatus.INTERVIEW]: { color: 'bg-purple-100 text-purple-700 border-purple-200' },
  [ApplicationStatus.OFFER]: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  [ApplicationStatus.HIRED]: { color: 'bg-green-100 text-green-700 border-green-200' },
  [ApplicationStatus.REJECTED]: { color: 'bg-red-100 text-red-700 border-red-200' },
};
