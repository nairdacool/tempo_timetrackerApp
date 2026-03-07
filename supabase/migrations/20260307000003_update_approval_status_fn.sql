-- ============================================================
-- Atomic SECURITY DEFINER function to approve/reject a timesheet.
--
-- WHY: The admin's Supabase client runs under the admin's JWT.
-- PostgreSQL applies the SELECT RLS policy as a row-filter
-- before evaluating the UPDATE policy. If the SELECT policy is
-- `user_id = auth.uid()` the admin can't see — and therefore
-- can't UPDATE — another user's time_entries, even though the
-- UPDATE policy explicitly grants admin access. This causes
-- updateApprovalStatus() to silently update 0 rows, leaving
-- the developer's entries stuck on 'pending'.
--
-- SECURITY DEFINER bypasses RLS entirely, running as the
-- function owner (postgres / service role). The function still
-- validates that the caller is an Admin before doing anything.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_approval_status(
  p_approval_id   uuid,
  p_status        text,          -- 'approved' | 'rejected'
  p_reason        text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role   text;
  v_user_id       uuid;
  v_week_start    date;
  v_week_end      date;
BEGIN
  -- 1. Confirm the caller is an Admin.
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role IS DISTINCT FROM 'Admin' THEN
    RAISE EXCEPTION 'Permission denied: only Admins can update approval status';
  END IF;

  -- 2. Validate the status value.
  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- 3. Fetch the approval record.
  SELECT user_id, week_start, week_end
  INTO   v_user_id, v_week_start, v_week_end
  FROM   public.approvals
  WHERE  id = p_approval_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approval % not found', p_approval_id;
  END IF;

  -- 4. Update the approval row.
  UPDATE public.approvals
  SET
    status           = p_status,
    reviewed_at      = now(),
    rejection_reason = CASE
                         WHEN p_status = 'rejected' THEN p_reason
                         ELSE NULL
                       END
  WHERE id = p_approval_id;

  -- 5. Update the matching time_entries (bypasses RLS via SECURITY DEFINER).
  UPDATE public.time_entries
  SET status = p_status
  WHERE user_id = v_user_id
    AND date >= v_week_start
    AND date <= v_week_end
    AND status = 'pending';
END;
$$;

-- Grant execute to authenticated users (the ADMIN check is inside the fn).
GRANT EXECUTE ON FUNCTION public.update_approval_status(uuid, text, text)
  TO authenticated;
