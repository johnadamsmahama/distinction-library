-- ============================================================================
-- DISTINCTION LIBRARY — STORAGE BUCKETS (Stage 3)
-- Run AFTER schema.sql and rls_policies.sql.
-- Supabase Storage uses its own RLS system on the storage.objects table.
-- ============================================================================

-- Buckets:
--   past-papers        -> original student uploads awaiting/after moderation
--   past-papers-final   -> watermarked, approved versions served publicly
--   study-materials     -> lecture slides / notes / guides
--   blog-images         -> cover images for Study Blog posts
--   avatars              -> optional, not in brief but commonly needed later

insert into storage.buckets (id, name, public)
values
  ('past-papers', 'past-papers', false),
  ('past-papers-final', 'past-papers-final', true),
  ('study-materials', 'study-materials', true),
  ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- past-papers (private — raw uploads, pending moderation)
-- Only the uploader and staff can read; only authenticated students can write.
-- ----------------------------------------------------------------------------
create policy "read own or staff — past-papers"
  on storage.objects for select
  using (
    bucket_id = 'past-papers'
    and (owner = auth.uid() or is_staff())
  );

create policy "students upload — past-papers"
  on storage.objects for insert
  with check (
    bucket_id = 'past-papers'
    and auth.role() = 'authenticated'
  );

create policy "staff delete — past-papers"
  on storage.objects for delete
  using (bucket_id = 'past-papers' and is_staff());

-- ----------------------------------------------------------------------------
-- past-papers-final (public — watermarked, approved, downloadable by anyone
-- logged in; written only by the moderation approval process)
-- ----------------------------------------------------------------------------
create policy "read approved papers"
  on storage.objects for select
  using (bucket_id = 'past-papers-final' and auth.role() = 'authenticated');

create policy "only staff write approved papers"
  on storage.objects for insert
  with check (bucket_id = 'past-papers-final' and is_staff());

-- ----------------------------------------------------------------------------
-- study-materials (public to logged-in students; staff + original uploader
-- can write, matching the study_materials table policy)
-- ----------------------------------------------------------------------------
create policy "read study materials"
  on storage.objects for select
  using (bucket_id = 'study-materials' and auth.role() = 'authenticated');

create policy "upload study materials"
  on storage.objects for insert
  with check (bucket_id = 'study-materials' and auth.role() = 'authenticated');

create policy "staff manage study materials files"
  on storage.objects for delete
  using (bucket_id = 'study-materials' and is_staff());

-- ----------------------------------------------------------------------------
-- blog-images (public read, admin write)
-- ----------------------------------------------------------------------------
create policy "anyone reads blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

create policy "admins write blog images"
  on storage.objects for insert
  with check (bucket_id = 'blog-images' and is_admin());

-- ============================================================================
-- NOTE ON WATERMARKING (Feature 08):
-- Supabase Storage does not watermark files itself. The recommended flow:
--   1. Student uploads raw PDF -> 'past-papers' bucket, row created with
--      status = 'pending'.
--   2. Moderator approves in the admin dashboard.
--   3. A server-side function (Next.js API route or Supabase Edge Function)
--      stamps "Distinction Library — A J.A. Mahama Initiative" onto the PDF
--      (e.g. using pdf-lib) and uploads the result to 'past-papers-final'.
--   4. past_papers.watermarked_url is set to the new file's path, and
--      status flips to 'approved'.
-- This keeps watermarking automatic from the moderator's perspective (they
-- only click Approve) while keeping raw/uploader files separated from the
-- public, watermarked ones — exactly as the brief requires.
-- ============================================================================
