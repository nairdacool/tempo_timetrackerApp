-- ============================================================
-- Protect approved time entries from being edited or deleted
-- by non-admin users.
--
-- Admins (role = 'Admin' in profiles) retain full access.
-- Non-admins can only UPDATE/DELETE their own entries when
-- the entry status is NOT 'approved'.
-- ============================================================

-- DROP existing generic update/delete policies if they exist
-- so we can replace them with the more specific ones below.
DROP POLICY IF EXISTS "Users can update own time entries"  ON public.time_entries;
DROP POLICY IF EXISTS "Users can delete own time entries"  ON public.time_entries;
DROP POLICY IF EXISTS "users_cannot_edit_approved_entries" ON public.time_entries;
DROP POLICY IF EXISTS "users_cannot_delete_approved_entries" ON public.time_entries;

-- UPDATE: admins can update any entry; non-admins can only
-- update their own entries that are not yet approved.
CREATE POLICY "users_cannot_edit_approved_entries"
ON public.time_entries
FOR UPDATE
USING (
  -- Admins bypass all restrictions
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  )
  OR
  -- Non-admins: must own the entry AND it must not be approved
  (user_id = auth.uid() AND status <> 'approved')
)
WITH CHECK (
  -- Same conditions apply to the new row state after update
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  )
  OR
  (user_id = auth.uid() AND status <> 'approved')
);

-- DELETE: same logic — approved entries are locked for non-admins.
CREATE POLICY "users_cannot_delete_approved_entries"
ON public.time_entries
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  )
  OR
  (user_id = auth.uid() AND status <> 'approved')
);
