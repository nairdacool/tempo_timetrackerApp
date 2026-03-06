-- ============================================================
-- Add rejection_reason column to approvals table.
--
-- Stores the optional reason text when an admin rejects a
-- timesheet. Cleared automatically on resubmission.
-- ============================================================

ALTER TABLE public.approvals
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
