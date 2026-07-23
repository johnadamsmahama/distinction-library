-- ============================================================================
-- DISTINCTION LIBRARY — STAGE 10 SCHEMA ADDITIONS
-- Run AFTER all previous supabase/*.sql files.
--
-- Tightens a policy that became a real risk now that role management is a
-- built feature (Stage 10 Admin Dashboard): the original Stage 3 policy let
-- ANY staff member (moderator or admin) update ANY profile — including the
-- `role` column. That meant a moderator could grant themselves admin.
-- Restricting profile updates-by-others to admins only closes that.
-- ============================================================================

drop policy if exists "staff can update any profile" on profiles;

create policy "admins can update any profile"
  on profiles for update
  using (is_admin());

-- Students and moderators can still update their OWN profile (name,
-- department, level) via the existing "users update own profile" policy —
-- that one was never the problem and is untouched.
