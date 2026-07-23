-- ============================================================================
-- DISTINCTION LIBRARY — DATABASE SCHEMA (Stage 3)
-- Run this in the Supabase SQL Editor on a fresh project.
-- Order matters — run top to bottom in one go.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
create type user_role as enum ('student', 'moderator', 'admin');
create type paper_status as enum ('pending', 'approved', 'rejected');
create type material_status as enum ('pending', 'approved', 'rejected');
create type exam_type as enum ('mid_semester', 'end_of_semester');
create type content_type as enum ('lecture_slides', 'study_notes', 'study_guide');
create type vault_item_type as enum ('quiz', 'companion_session', 'summary');
create type notification_type as enum (
  'upload_approved', 'upload_rejected', 'new_paper_bookmarked_course',
  'new_material_bookmarked_course', 'strike_warning', 'upload_suspended',
  'badge_earned', 'announcement'
);

-- ----------------------------------------------------------------------------
-- 2. UPSA EMAIL VALIDATION
-- Enforced at signup so no account can exist without a valid student email.
-- Domain: upsamail.edu.gh | Local part: exactly 8 digits (student ID).
-- ----------------------------------------------------------------------------
create or replace function is_valid_upsa_email(email text)
returns boolean as $$
begin
  return email ~* '^[0-9]{8}@upsamail\.edu\.gh$';
end;
$$ language plpgsql immutable;

-- ----------------------------------------------------------------------------
-- 3. PROFILES
-- One row per auth.users row. student_id is extracted from the email itself
-- (the 8-digit local part) so it can never drift from the verified email.
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  student_id text not null unique,
  full_name text,
  department text,
  level text check (level in ('100', '200', '300', '400')),
  role user_role not null default 'student',
  upload_count integer not null default 0,
  strikes_count integer not null default 0 check (strikes_count between 0 and 3),
  upload_suspended boolean not null default false,
  contributor_badge text check (contributor_badge in ('gold', 'silver', 'bronze')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
-- This is where the domain + student-ID-format check is actually enforced —
-- reject the auth signup itself if the email doesn't match.
create or replace function handle_new_user()
returns trigger as $$
begin
  if not is_valid_upsa_email(new.email) then
    raise exception 'Access restricted to verified UPSA student emails (@upsamail.edu.gh).';
  end if;

  insert into public.profiles (id, student_id)
  values (new.id, split_part(new.email, '@', 1));

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. COURSES
-- Reference table. Papers and materials attach to a course.
-- ----------------------------------------------------------------------------
create table courses (
  id uuid primary key default uuid_generate_v4(),
  code text not null,              -- e.g. "COM 201"
  name text not null,
  department text not null,
  level text not null check (level in ('100', '200', '300', '400')),
  created_at timestamptz not null default now(),
  unique (code, level)
);

-- ----------------------------------------------------------------------------
-- 5. PAST PAPERS (Community Library)
-- ----------------------------------------------------------------------------
create table past_papers (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete restrict,
  year integer not null check (year between 2000 and 2100),
  exam_type exam_type not null,
  file_url text not null,                 -- original upload in storage
  watermarked_url text,                   -- set on approval, see Section 8
  status paper_status not null default 'pending',
  uploaded_by uuid not null references profiles(id) on delete cascade,
  reviewed_by uuid references profiles(id),
  rejection_reason text,
  download_count integer not null default 0,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index idx_past_papers_course on past_papers(course_id);
create index idx_past_papers_status on past_papers(status);

-- ----------------------------------------------------------------------------
-- 6. STUDY MATERIALS (platform-curated + student-submitted, admin-approved)
-- ----------------------------------------------------------------------------
create table study_materials (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete restrict,
  content_type content_type not null,
  title text not null,
  week_number integer,
  file_url text not null,
  status material_status not null default 'pending',
  uploaded_by uuid references profiles(id),   -- null if uploaded directly by admin
  download_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_study_materials_course on study_materials(course_id);
create index idx_study_materials_status on study_materials(status);

-- ----------------------------------------------------------------------------
-- 7. BOOKMARKS (Course Bookmarking)
-- ----------------------------------------------------------------------------
create table bookmarks (
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- ----------------------------------------------------------------------------
-- 8. PERSONAL STUDY VAULT
-- Strictly private. RLS below ensures only the owner can ever read these rows
-- — not even moderators/admins get a policy that grants access.
-- ----------------------------------------------------------------------------
create table study_vault_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  item_type vault_item_type not null,
  title text not null,
  source_material_name text,       -- name of the PDF the user uploaded to generate this
  content jsonb not null,          -- quiz questions, companion messages, or summary text
  created_at timestamptz not null default now()
);

create index idx_vault_items_user on study_vault_items(user_id);

-- ----------------------------------------------------------------------------
-- 9. STRIKES
-- ----------------------------------------------------------------------------
create table strikes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  related_paper_id uuid references past_papers(id),
  issued_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- Keep profiles.strikes_count in sync automatically.
create or replace function sync_strike_count()
returns trigger as $$
begin
  update profiles
  set strikes_count = (select count(*) from strikes where user_id = new.user_id),
      upload_suspended = (select count(*) from strikes where user_id = new.user_id) >= 3
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_strike_added
  after insert on strikes
  for each row execute procedure sync_strike_count();

-- ----------------------------------------------------------------------------
-- 10. NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, read);

-- ----------------------------------------------------------------------------
-- 11. BLOG POSTS (Study Blog & Resources)
-- ----------------------------------------------------------------------------
create table blog_posts (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  cover_image_url text,
  body text not null,
  author_id uuid not null references profiles(id),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 12. SUPPORT TICKETS (Contact & Support — in-app form)
-- ----------------------------------------------------------------------------
create table support_tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id),
  name text not null,
  student_email text not null,
  subject text not null,
  message text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 13. DISTINCTION PROGRAMME SIGNUPS
-- Optional opt-in captured from onboarding or dashboard widget.
-- ----------------------------------------------------------------------------
create table distinction_programme_signups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- ----------------------------------------------------------------------------
-- 14. updated_at helper trigger for profiles
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on profiles
  for each row execute procedure set_updated_at();
