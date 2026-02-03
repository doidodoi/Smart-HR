
-- ==========================================
-- 1. SETUP EXTENSIONS & STORAGE
-- ==========================================

-- Enable Vector extension for AI Matching
create extension if not exists vector;

-- Create Storage Bucket for CVs if it doesn't exist
insert into storage.buckets (id, name, public) 
values ('CV', 'CV', true)
on conflict (id) do update set public = true;

-- ==========================================
-- 2. CREATE/UPDATE TABLES
-- ==========================================

-- 2.1 TABLE: JOBS
create table if not exists jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  department text not null,
  description text,
  requirements text[] default '{}',
  embedding vector(1536), 
  created_at timestamptz default now()
);

-- Ensure columns exist (for updates)
alter table jobs add column if not exists requirements text[] default '{}';
alter table jobs add column if not exists embedding vector(1536);

-- 2.2 TABLE: CANDIDATES
create table if not exists candidates (
  id uuid default gen_random_uuid() primary key,
  first_name text,
  last_name text,
  full_name text generated always as (first_name || ' ' || last_name) stored,
  email text,
  phone text,
  
  -- Address Fields
  address text,
  village text,
  district text,
  province text,
  
  -- Salary
  expected_salary text,

  gender text,
  age int,
  experience_years int,
  work_history text,
  education text,
  skills text[],
  avatar_url text,
  resume_url text,
  raw_text text,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Fix Missing Columns if table already exists
alter table candidates add column if not exists village text;
alter table candidates add column if not exists district text;
alter table candidates add column if not exists province text;
alter table candidates add column if not exists expected_salary text;
alter table candidates add column if not exists address text;
alter table candidates add column if not exists work_history text;
alter table candidates add column if not exists education text;
alter table candidates add column if not exists skills text[];
alter table candidates add column if not exists resume_url text;
alter table candidates add column if not exists full_name text generated always as (first_name || ' ' || last_name) stored;

-- 2.3 TABLE: APPLICATIONS
create table if not exists applications (
  id uuid default gen_random_uuid() primary key,
  candidate_id uuid references candidates(id) on delete cascade,
  job_id uuid references jobs(id),
  status text,
  ai_match_score int,
  ai_summary text,
  ai_job_suggestions jsonb default null, 
  cv_url text,
  is_hidden boolean default false,
  
  -- Interview Details
  interview_date timestamptz,
  interview_type text,     -- 'ONLINE' or 'ONSITE'
  interview_location text, -- Google Meet Link or Office Address

  applied_at timestamptz default now(),
  updated_at timestamptz
);

-- Ensure columns exist (for updates)
alter table applications add column if not exists ai_job_suggestions jsonb default null;
alter table applications add column if not exists is_hidden boolean default false;
alter table applications add column if not exists interview_type text;
alter table applications add column if not exists interview_location text;

-- PERFORMANCE INDEX: Make filtering by is_hidden fast
create index if not exists idx_apps_is_hidden on applications(is_hidden);

-- 2.4 TABLE: CANDIDATE LOCALIZATIONS (Translations)
create table if not exists candidate_localizations (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references applications(id) on delete cascade,
  language_code text,
  work_history_translated text,
  education_translated text,
  ai_summary_translated text,
  created_at timestamptz default now()
);

-- ==========================================
-- 3. RLS POLICIES (PERMISSIVE FOR MOCK AUTH)
-- ==========================================
-- Since the app uses a Mock Auth system (localStorage) and does not sign in to Supabase,
-- all requests are treated as 'anon'. We must allow 'anon' to perform operations.

alter table jobs enable row level security;
alter table candidates enable row level security;
alter table applications enable row level security;
alter table candidate_localizations enable row level security;

-- 3.1 JOBS
drop policy if exists "Enable all access for jobs" on jobs;
create policy "Enable all access for jobs" on jobs for all using (true) with check (true);

-- 3.2 CANDIDATES
drop policy if exists "Enable all access for candidates" on candidates;
create policy "Enable all access for candidates" on candidates for all using (true) with check (true);

-- 3.3 APPLICATIONS
drop policy if exists "Enable all access for applications" on applications;
create policy "Enable all access for applications" on applications for all using (true) with check (true);

-- 3.4 LOCALIZATIONS
drop policy if exists "Enable all access for localizations" on candidate_localizations;
create policy "Enable all access for localizations" on candidate_localizations for all using (true) with check (true);

-- 3.5 STORAGE (CV Bucket)
drop policy if exists "Public CV Upload" on storage.objects;
create policy "Public CV Upload" on storage.objects for insert with check ( bucket_id = 'CV' );

drop policy if exists "Public CV Select" on storage.objects;
create policy "Public CV Select" on storage.objects for select using ( bucket_id = 'CV' );

-- ==========================================
-- 4. AI MATCHING FUNCTION
-- ==========================================
create or replace function match_candidates_to_jobs (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  department text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    jobs.id,
    jobs.title,
    jobs.department,
    1 - (jobs.embedding <=> query_embedding) as similarity
  from jobs
  where 1 - (jobs.embedding <=> query_embedding) > match_threshold
  order by jobs.embedding <=> query_embedding
  limit match_count;
end;
$$;
