-- ============================================================================
-- DISTINCTION LIBRARY — ROW LEVEL SECURITY POLICIES (Stage 3)
-- Run AFTER schema.sql. These are the real enforcement layer — even if a bug
-- in the app code forgets a filter, the database itself refuses the query.
-- ============================================================================

-- Helper: is the current user a moderator or admin?
create or replace function is_staff()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$ language sql security definer stable;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ----------------------------------------------------------------------------
-- PROFILES
-- Everyone (logged in) can read basic profile info (needed for leaderboard,
-- "uploaded by" attribution). Only the owner or an admin can update.
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles readable by any authenticated student"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "users update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "staff can update any profile"
  on profiles for update
  using (is_staff());

-- ----------------------------------------------------------------------------
-- COURSES — public reference data, staff-managed
-- ----------------------------------------------------------------------------
alter table courses enable row level security;

create policy "courses readable by authenticated students"
  on courses for select
  using (auth.role() = 'authenticated');

create policy "only staff manage courses"
  on courses for all
  using (is_staff());

-- ----------------------------------------------------------------------------
-- PAST PAPERS
-- Approved papers: visible to everyone logged in.
-- Pending/rejected: visible only to the uploader and staff (moderation queue).
-- ----------------------------------------------------------------------------
alter table past_papers enable row level security;

create policy "approved papers visible to all students"
  on past_papers for select
  using (status = 'approved' or uploaded_by = auth.uid() or is_staff());

create policy "students submit papers"
  on past_papers for insert
  with check (
    uploaded_by = auth.uid()
    and not (select upload_suspended from profiles where id = auth.uid())
  );

create policy "only staff review papers"
  on past_papers for update
  using (is_staff());

-- ----------------------------------------------------------------------------
-- STUDY MATERIALS — same visibility pattern as past papers
-- ----------------------------------------------------------------------------
alter table study_materials enable row level security;

create policy "approved materials visible to all students"
  on study_materials for select
  using (status = 'approved' or uploaded_by = auth.uid() or is_staff());

create policy "students submit materials"
  on study_materials for insert
  with check (uploaded_by = auth.uid());

create policy "only staff review materials"
  on study_materials for update
  using (is_staff());

-- ----------------------------------------------------------------------------
-- BOOKMARKS — fully private to each student
-- ----------------------------------------------------------------------------
alter table bookmarks enable row level security;

create policy "users manage own bookmarks"
  on bookmarks for all
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- STUDY VAULT — absolute privacy. No staff policy exists for this table
-- at all, by design. Not even an admin role can select another user's rows.
-- ----------------------------------------------------------------------------
alter table study_vault_items enable row level security;

create policy "users fully own their vault"
  on study_vault_items for all
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- STRIKES — visible to the affected student (read-only) and staff (full)
-- ----------------------------------------------------------------------------
alter table strikes enable row level security;

create policy "students view own strikes"
  on strikes for select
  using (user_id = auth.uid() or is_staff());

create policy "only staff issue strikes"
  on strikes for insert
  with check (is_staff());

create policy "only staff modify strikes"
  on strikes for update
  using (is_staff());

create policy "only staff remove strikes"
  on strikes for delete
  using (is_staff());

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS — private to recipient
-- ----------------------------------------------------------------------------
alter table notifications enable row level security;

create policy "users view own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "users mark own notifications read"
  on notifications for update
  using (user_id = auth.uid());

create policy "system/staff create notifications"
  on notifications for insert
  with check (is_staff());

-- ----------------------------------------------------------------------------
-- BLOG POSTS — published posts visible to all; drafts staff-only
-- ----------------------------------------------------------------------------
alter table blog_posts enable row level security;

create policy "published posts visible to all students"
  on blog_posts for select
  using (published = true or is_staff());

create policy "only admins manage blog posts"
  on blog_posts for insert
  with check (is_admin());

create policy "only admins update blog posts"
  on blog_posts for update
  using (is_admin());

create policy "only admins delete blog posts"
  on blog_posts for delete
  using (is_admin());

-- ----------------------------------------------------------------------------
-- SUPPORT TICKETS — student can create + view own; staff view all
-- ----------------------------------------------------------------------------
alter table support_tickets enable row level security;

create policy "students view own tickets"
  on support_tickets for select
  using (user_id = auth.uid() or is_staff());

create policy "students submit tickets"
  on support_tickets for insert
  with check (user_id = auth.uid());

create policy "staff update tickets"
  on support_tickets for update
  using (is_staff());

-- ----------------------------------------------------------------------------
-- DISTINCTION PROGRAMME SIGNUPS — private; only owner + admin can see
-- (brief requires this data is "never displayed publicly")
-- ----------------------------------------------------------------------------
alter table distinction_programme_signups enable row level security;

create policy "users view own signup"
  on distinction_programme_signups for select
  using (user_id = auth.uid() or is_admin());

create policy "users create own signup"
  on distinction_programme_signups for insert
  with check (user_id = auth.uid());
