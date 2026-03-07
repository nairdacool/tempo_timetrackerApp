-- ============================================================
-- Allow Admins to SELECT all time_entries (not just their own).
--
-- The initial RLS SELECT policy is `user_id = auth.uid()`.
-- This prevents admins from reading other users' entries even
-- when filtering with .in('user_id', [...]) — Postgres silently
-- intersects the application filter with the RLS row filter,
-- returning only the admin's own rows. Reports and the dashboard
-- therefore showed 0h for admins.
-- ============================================================

-- The default policy name from Supabase's starter schema is
-- "Users can view own time entries". Drop whichever variant exists.
DROP POLICY IF EXISTS "Users can view own time entries"   ON public.time_entries;
DROP POLICY IF EXISTS "Users can read own time entries"   ON public.time_entries;
DROP POLICY IF EXISTS "time_entries_select_policy"        ON public.time_entries;

-- New SELECT policy: users see their own rows; admins see everything.
CREATE POLICY "time_entries_select_policy"
ON public.time_entries
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  )
);
