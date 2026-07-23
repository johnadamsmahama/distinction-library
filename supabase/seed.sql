-- ============================================================================
-- DISTINCTION LIBRARY — SEED DATA (optional, for local/dev testing)
-- Sample UPSA courses so the dashboard and search aren't empty during Stage 4+.
-- Adjust or delete before going live.
-- ============================================================================

insert into courses (code, name, department, level) values
  ('COM 101', 'Introduction to Communication Studies', 'Communication Studies', '100'),
  ('COM 201', 'Public Relations Principles', 'Communication Studies', '200'),
  ('COM 301', 'Broadcast Journalism', 'Communication Studies', '300'),
  ('BUS 101', 'Principles of Management', 'Business Administration', '100'),
  ('BUS 201', 'Business Statistics', 'Business Administration', '200'),
  ('ACC 101', 'Financial Accounting I', 'Accounting', '100'),
  ('IT 101', 'Introduction to Information Technology', 'Information Technology', '100'),
  ('IT 201', 'Database Management Systems', 'Information Technology', '200'),
  ('BGEC 102', 'Scholarly Writing', 'General Education', '100'),
  ('CS100', 'Introduction to Journalism', 'Communication Studies', '100')
on conflict (code, level) do nothing;
