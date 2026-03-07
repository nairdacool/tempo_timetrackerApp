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
INSERT INTO public.organizations (id, name)
VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Test Corp');

-- Patch the auth trigger so it falls back to the test org when no
-- organization metadata is provided (i.e. users created via the dashboard).
-- This replaces the function temporarily for test use.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  org_id   uuid;
  org_name text;
BEGIN
  org_name := coalesce(new.raw_user_meta_data->>'organization', '');

  IF org_name <> '' THEN
    INSERT INTO organizations (name) VALUES (org_name) RETURNING id INTO org_id;
  END IF;

  -- Fallback: use the test org if no org was resolved
  IF org_id IS NULL THEN
    SELECT id INTO org_id FROM public.organizations LIMIT 1;
  END IF;

  INSERT INTO profiles (id, full_name, initials, role, color, organization_id)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'initials',  'NU'),
    coalesce(new.raw_user_meta_data->>'role',       'Developer'),
    coalesce(new.raw_user_meta_data->>'color',      '#c8602a'),
    org_id
  );
  RETURN new;
END;
$$;

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
