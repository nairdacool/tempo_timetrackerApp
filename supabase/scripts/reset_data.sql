-- ============================================================
-- FULL DATA RESET SCRIPT
-- Wipes all application data while preserving the schema.
-- Use before automation test runs or to reset a staging env.
--
-- HOW TO RUN:
--   Paste into Supabase SQL Editor and execute.
--
-- IMPORTANT: This does NOT delete Supabase Auth users.
--   After running this script, also go to:
--   Supabase Dashboard → Authentication → Users → select all → Delete
--   (or use the service-role API — see bottom of this file)
-- ============================================================

-- Delete in dependency order to avoid FK violations.
-- time_entries and approvals reference profiles + projects.
-- project_members references profiles + projects.
-- profiles references organizations (via organization_id).

DELETE FROM public.time_entries;
DELETE FROM public.approvals;
DELETE FROM public.project_members;
DELETE FROM public.projects;
DELETE FROM public.profiles;
DELETE FROM public.organizations;

-- Pre-create the test organization with a fixed UUID.
-- This is required so the auth trigger (handle_new_user) can create
-- a profile row when you add auth users in the Supabase dashboard.
INSERT INTO public.organizations (id, name)
VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Test Corp');

-- Verify state
SELECT 'organizations'    AS "table", COUNT(*) AS rows FROM public.organizations
UNION ALL SELECT 'profiles',          COUNT(*) FROM public.profiles
UNION ALL SELECT 'projects',          COUNT(*) FROM public.projects
UNION ALL SELECT 'project_members',   COUNT(*) FROM public.project_members
UNION ALL SELECT 'time_entries',      COUNT(*) FROM public.time_entries
UNION ALL SELECT 'approvals',         COUNT(*) FROM public.approvals
ORDER BY "table";
-- Expected: organizations=1, everything else=0

-- ============================================================
-- OPTIONAL: Delete Auth users via service-role API
-- Run this in a terminal (replace URL and SERVICE_ROLE_KEY):
--
--   curl -X DELETE \
--     'https://<project-id>.supabase.co/auth/v1/admin/users' \
--     -H 'apikey: <SERVICE_ROLE_KEY>' \
--     -H 'Authorization: Bearer <SERVICE_ROLE_KEY>'
--
-- Or delete users one by one from the Supabase dashboard:
--   Authentication → Users → select all → Delete
-- ============================================================
