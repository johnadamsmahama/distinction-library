-- ============================================================================
-- DISTINCTION LIBRARY — STAGE 7 SCHEMA ADDITIONS
-- Run AFTER all previous supabase/*.sql files.
-- Study materials didn't originally have reviewer metadata — past_papers did,
-- since watermarking made that pipeline more involved from the start. Adding
-- the same fields here for consistency, now that materials go through the
-- same moderation queue.
-- ============================================================================

alter table study_materials
  add column if not exists reviewed_by uuid references profiles(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists rejection_reason text;
