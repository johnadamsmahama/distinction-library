-- ============================================================================
-- DISTINCTION LIBRARY — STAGE 11 SCHEMA ADDITIONS
-- Run AFTER all previous supabase/*.sql files.
--
-- NOTE: This file (and the tables/trigger it documents — leaderboard_periods,
-- leaderboard_entries, badges, user_badges, and the handle_paper_approved()
-- upsert trigger) has ALREADY been applied directly to the live database via
-- the Supabase connector. This file exists only so the repo has a record of
-- it — you do not need to run it again. If you ever rebuild the database
-- from scratch, run it after stage10_admin.sql.
--
-- Closes the last gap from that session: leaderboard_entries.rank and .tier
-- existed but nothing computed them. This mirrors the existing
-- recompute_contributor_badges() pattern (stage9) — top 3 by upload_count
-- within a period become gold/silver/bronze — but scoped per-period instead
-- of globally, since the leaderboard now resets each semester.
-- ============================================================================

create or replace function public.recompute_leaderboard_ranks()
returns trigger as $$
begin
  update public.leaderboard_entries le
  set rank = r.rnk,
      tier = case r.rnk when 1 then 'gold' when 2 then 'silver' when 3 then 'bronze' else null end,
      updated_at = now()
  from (
    select id, row_number() over (partition by period_id order by upload_count desc, user_id) as rnk
    from public.leaderboard_entries
  ) r
  where le.id = r.id
    and (
      le.rank is distinct from r.rnk
      or le.tier is distinct from case r.rnk when 1 then 'gold' when 2 then 'silver' when 3 then 'bronze' else null end
    );
  return null;
end;
$$ language plpgsql security definer set search_path to 'public';

drop trigger if exists on_leaderboard_entry_count_changed on public.leaderboard_entries;

create trigger on_leaderboard_entry_count_changed
  after insert or update of upload_count on public.leaderboard_entries
  for each statement
  execute procedure public.recompute_leaderboard_ranks();
