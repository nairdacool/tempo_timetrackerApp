-- ============================================================
-- Add billable column to projects table.
--
-- Flags whether time logged against a project is billable
-- to the client. Defaults to TRUE for all existing projects.
-- ============================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS billable BOOLEAN NOT NULL DEFAULT TRUE;
