-- ============================================================================
-- DISTINCTION LIBRARY — STAGE 9 SCHEMA ADDITIONS
-- Run AFTER all previous supabase/*.sql files.
-- Closes a gap from Stage 7: profiles.upload_count existed but nothing ever
-- incremented it. Also adds the "new content in your bookmarked course"
-- notifications the brief calls for, and live contributor badges for the
-- Leaderboard (Stage 9 UI).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Increment the uploader's approved-paper count when a paper is approved.
-- ----------------------------------------------------------------------------
create or replace function sync_upload_count()
returns trigger as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update profiles set upload_count = upload_count + 1 where id = new.uploaded_by;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_paper_approved
  after update on past_papers
  for each row execute procedure sync_upload_count();

-- ----------------------------------------------------------------------------
-- 2. Recompute Gold/Silver/Bronze contributor badges whenever upload counts
-- change. Statement-level (fires once per UPDATE, not once per row) so a
-- batch of approvals doesn't do redundant work.
-- ----------------------------------------------------------------------------
create or replace function recompute_contributor_badges()
returns trigger as $$
begin
  update profiles set contributor_badge = null where contributor_badge is not null;

  update profiles p
  set contributor_badge = r.badge
  from (
    select id,
      case row_number() over (order by upload_count desc, id)
        when 1 then 'gold'
        when 2 then 'silver'
        when 3 then 'bronze'
      end as badge
    from profiles
    where upload_count > 0
    order by upload_count desc, id
    limit 3
  ) r
  where p.id = r.id;

  return null;
end;
$$ language plpgsql security definer;

create trigger on_upload_count_changed
  after update of upload_count on profiles
  for each statement
  execute procedure recompute_contributor_badges();

-- ----------------------------------------------------------------------------
-- 3. Notify every student who bookmarked a course when new approved content
-- lands in it — separate functions for papers vs materials since the
-- message copy differs, but same trigger shape.
-- ----------------------------------------------------------------------------
create or replace function notify_bookmarkers_on_paper_approval()
returns trigger as $$
declare
  course_code text;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    select code into course_code from courses where id = new.course_id;

    insert into notifications (user_id, type, message)
    select b.user_id, 'new_paper_bookmarked_course',
      'A new past paper was added for ' || course_code || ' (' ||
      case new.exam_type when 'mid_semester' then 'Mid-Semester' else 'End of Semester' end ||
      ' ' || new.year || ').'
    from bookmarks b
    where b.course_id = new.course_id and b.user_id != new.uploaded_by;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_paper_approved_notify_bookmarkers
  after update on past_papers
  for each row execute procedure notify_bookmarkers_on_paper_approval();

create or replace function notify_bookmarkers_on_material_approval()
returns trigger as $$
declare
  course_code text;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    select code into course_code from courses where id = new.course_id;

    insert into notifications (user_id, type, message)
    select b.user_id, 'new_material_bookmarked_course',
      'New study material was added for ' || course_code || ': "' || new.title || '".'
    from bookmarks b
    where b.course_id = new.course_id
      and (new.uploaded_by is null or b.user_id != new.uploaded_by);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_material_approved_notify_bookmarkers
  after update on study_materials
  for each row execute procedure notify_bookmarkers_on_material_approval();
