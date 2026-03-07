-- ============================================================
-- TEST DATA SEED SCRIPT
-- Populates the database with a consistent baseline for
-- automation framework testing.
--
-- PREREQUISITES:
--   1. Run reset_data.sql first (or run on a clean DB)
--   2. Create TWO auth users manually in the Supabase dashboard
--      (Authentication → Users → Add user) with these emails:
--        admin@test.com   → password: Test1234!
--        dev@test.com     → password: Test1234!
--      Then copy their UUIDs into the variables below.
--
-- HOW TO RUN:
--   Replace the two UUIDs at the top, then paste into SQL Editor.
-- ============================================================

-- ⚠️  Replace these with the actual UUIDs from your auth users
DO $$
DECLARE
  admin_id  uuid := 'aaaaaaaa-0000-0000-0000-000000000001'; -- replace me
  dev_id    uuid := 'bbbbbbbb-0000-0000-0000-000000000002'; -- replace me

  -- Fixed org UUID — matches the one pre-created by reset_data.sql
  org_id    uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  proj1_id  uuid;
  proj2_id  uuid;
BEGIN

  -- The organization was already created by reset_data.sql.
  -- Just update its name in case it was changed.
  UPDATE public.organizations SET name = 'Test Corp'
  WHERE id = org_id;

  -- Profiles: use ON CONFLICT DO UPDATE because the auth trigger
  -- (handle_new_user) may have already inserted a stub row when
  -- the auth users were created in the Supabase dashboard.
  INSERT INTO public.profiles (id, full_name, initials, role, color, organization_id, is_active)
  VALUES
    (admin_id, 'Admin User',     'AU', 'Admin',     '#c8602a', org_id, true),
    (dev_id,   'Developer User', 'DU', 'Developer', '#2a5fa8', org_id, true)
  ON CONFLICT (id) DO UPDATE SET
    full_name       = EXCLUDED.full_name,
    initials        = EXCLUDED.initials,
    role            = EXCLUDED.role,
    color           = EXCLUDED.color,
    organization_id = EXCLUDED.organization_id,
    is_active       = EXCLUDED.is_active;

  -- Projects
  INSERT INTO public.projects (id, name, client, color, budget_hours, status, billable, created_by)
  VALUES
    (gen_random_uuid(), 'Alpha Project', 'Client A', '#c8602a', 80,  'active',  true,  admin_id),
    (gen_random_uuid(), 'Beta Project',  'Client B', '#2a7a4f', 120, 'active',  false, admin_id)
  RETURNING id INTO proj1_id;

  -- Re-fetch project IDs for use in entries
  SELECT id INTO proj1_id FROM public.projects WHERE name = 'Alpha Project';
  SELECT id INTO proj2_id FROM public.projects WHERE name = 'Beta Project';

  -- Project memberships
  INSERT INTO public.project_members (project_id, user_id) VALUES
    (proj1_id, dev_id),
    (proj2_id, dev_id);

  -- Time entries — current week (Mon–Fri), status: draft
  INSERT INTO public.time_entries
    (user_id, project_id, description, date, start_time, end_time, duration_minutes, status)
  VALUES
    (dev_id, proj1_id, 'Setup project structure',    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 1, '09:00', '11:00', 120, 'draft'),
    (dev_id, proj1_id, 'API integration',            CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 1, '11:00', '13:00', 120, 'draft'),
    (dev_id, proj2_id, 'Design review',              CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 2, '09:00', '10:30',  90, 'draft'),
    (dev_id, proj1_id, 'Bug fixes',                  CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int + 3, '10:00', '12:00', 120, 'draft');

  -- Time entries — last week, status: pending (submitted for approval)
  INSERT INTO public.time_entries
    (user_id, project_id, description, date, start_time, end_time, duration_minutes, status)
  VALUES
    (dev_id, proj1_id, 'Sprint planning',  CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int - 6, '09:00', '10:00', 60, 'pending'),
    (dev_id, proj1_id, 'Frontend work',    CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int - 5, '09:00', '13:00', 240, 'pending'),
    (dev_id, proj2_id, 'Documentation',   CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int - 4, '14:00', '16:00', 120, 'pending');

  -- Approval row for last week (pending)
  INSERT INTO public.approvals
    (user_id, week_start, week_end, total_hours, status, submitted_at)
  VALUES (
    dev_id,
    (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int - 6)::date,
    (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int)::date,
    7.0,
    'pending',
    now()
  );

END $$;

-- Confirm seeded data
SELECT 'organizations'    AS "table", COUNT(*) AS rows FROM public.organizations
UNION ALL SELECT 'profiles',          COUNT(*) FROM public.profiles
UNION ALL SELECT 'projects',          COUNT(*) FROM public.projects
UNION ALL SELECT 'project_members',   COUNT(*) FROM public.project_members
UNION ALL SELECT 'time_entries',      COUNT(*) FROM public.time_entries
UNION ALL SELECT 'approvals',         COUNT(*) FROM public.approvals
ORDER BY "table";
