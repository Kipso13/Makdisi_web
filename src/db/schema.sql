-- ============================================================================
-- School Plus — Makdisi School PostgreSQL / Supabase Schema Reference
-- Run this schema in your Supabase SQL Editor or PostgreSQL database when
-- switching VITE_DATA_PROVIDER from "demo" to "supabase" / "custom_api".
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Classes
create table if not exists public.classes (
  id text primary key,
  name text not null,
  academic_level text not null,
  room text not null,
  homeroom_teacher_id uuid,
  vice_representative_id uuid,
  schedule_summary text not null default '',
  created_at timestamptz not null default now()
);

-- 2. User Profiles (linked to auth.users in Supabase)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  role text not null check (role in ('student', 'teacher', 'admin')),
  avatar_url text,
  academic_level text,
  class_id text references public.classes(id) on delete set null,
  is_vice_representative boolean not null default false,
  vice_rep_class_id text references public.classes(id) on delete set null,
  department text,
  student_number text,
  bio text,
  created_at timestamptz not null default now()
);

-- 3. Teacher <-> Class assignments
create table if not exists public.teacher_classes (
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id text references public.classes(id) on delete cascade,
  primary key (teacher_id, class_id)
);

-- 4. Grades
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id text not null references public.classes(id) on delete cascade,
  subject_id text not null,
  subject_name text not null,
  assessment_title text not null,
  semester text not null check (semester in ('Semester 1', 'Semester 2')),
  score numeric(5,2) not null,
  max_score numeric(5,2) not null default 20,
  coefficient numeric(4,2) not null default 1,
  graded_at date not null default current_date,
  feedback text not null default '',
  teacher_id uuid not null references public.profiles(id)
);

-- 5. Attendance
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id text not null references public.classes(id) on delete cascade,
  occurred_on date not null default current_date,
  subject_name text not null,
  type text not null check (type in ('absent', 'late')),
  missed_hours numeric(4,1) not null default 1,
  status text not null check (status in ('justified', 'unjustified', 'pending')),
  note text not null default '',
  recorded_by text not null
);

-- 6. Private Student <-> Teacher Messaging
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject_label text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  attachment_name text,
  attachment_size text,
  sent_at timestamptz not null default now()
);

-- 7. Clubs & Memberships
create table if not exists public.clubs (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  schedule text not null,
  meeting_time text not null,
  location text not null,
  advisor_name text not null
);

create table if not exists public.club_members (
  club_id text references public.clubs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (club_id, user_id)
);

-- 8. Announcements & Timetables
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null,
  target_class_id text references public.classes(id) on delete set null,
  target_level text default 'All Levels',
  author_name text not null,
  author_role text not null,
  published_at timestamptz not null default now(),
  pinned boolean not null default false
);

-- 9. Private Problems & Suggestions (Routed to Class Vice Representative)
create table if not exists public.problem_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id text not null references public.classes(id) on delete cascade,
  vice_rep_id uuid not null references public.profiles(id),
  title text not null,
  category text not null,
  urgency text not null check (urgency in ('Low', 'Medium', 'High')),
  summary text not null,
  original_transcript jsonb not null default '[]'::jsonb,
  status text not null check (status in ('submitted', 'received', 'handled')) default 'submitted',
  handling_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Example Row Level Security (RLS) Policies for Privacy
-- ============================================================================
alter table public.grades enable row level security;
alter table public.attendance_records enable row level security;
alter table public.problem_reports enable row level security;

-- Students read only their own grades; Teachers read grades for assigned classes; Admins read all
create policy "grades_read_scoped" on public.grades
for select using (
  auth.uid() = student_id
  or exists (
    select 1 from public.teacher_classes tc
    where tc.teacher_id = auth.uid() and tc.class_id = grades.class_id
  )
  or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Reports are private to the submitting student, that class's vice rep, and admins
create policy "reports_read_private" on public.problem_reports
for select using (
  auth.uid() = student_id
  or auth.uid() = vice_rep_id
  or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);
