-- ============================================================================
-- DISTINCTION LIBRARY — DASHBOARD SUPPORT FUNCTIONS (Stage 5)
-- Run AFTER schema.sql, rls_policies.sql, storage_setup.sql.
-- These avoid N+1 queries for the dashboard's bookmarked-courses-with-counts
-- and leaderboard-rank requirements.
-- ============================================================================

-- Bookmarked courses, each with its live approved-content counts.
-- security definer so it can read past_papers/study_materials counts across
-- all statuses-of-interest regardless of the calling user's own RLS scope,
-- while still only returning THIS user's bookmarks (p_user_id is the caller).
create or replace function get_dashboard_bookmarks(p_user_id uuid)
returns table (
  course_id uuid,
  code text,
  name text,
  department text,
  level text,
  past_paper_count bigint,
  study_material_count bigint,
  bookmarked_at timestamptz
) as $$
  select
    c.id,
    c.code,
    c.name,
    c.department,
    c.level,
    (select count(*) from past_papers pp where pp.course_id = c.id and pp.status = 'approved') as past_paper_count,
    (select count(*) from study_materials sm where sm.course_id = c.id and sm.status = 'approved') as study_material_count,
    b.created_at as bookmarked_at
  from bookmarks b
  join courses c on c.id = b.course_id
  where b.user_id = p_user_id
  order by b.created_at desc;
$$ language sql stable security definer;

grant execute on function get_dashboard_bookmarks(uuid) to authenticated;

-- A student's leaderboard rank by approved upload_count. Ties share a rank.
create or replace function get_leaderboard_rank(p_user_id uuid)
returns integer as $$
  select rank::int from (
    select id, rank() over (order by upload_count desc) as rank
    from profiles
  ) ranked
  where id = p_user_id;
$$ language sql stable security definer;

grant execute on function get_leaderboard_rank(uuid) to authenticated;
