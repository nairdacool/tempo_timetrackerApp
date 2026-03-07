-- ============================================================
-- Add first-class clients table
-- Replaces the free-text projects.client column with a proper
-- FK relationship so clients are reusable across projects.
-- ============================================================

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  org_id     uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clients"
  ON public.clients FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage clients"
  ON public.clients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- 3. Migrate distinct client names from existing projects
--    (skip blank / 'Internal' — those map to NULL client_id)
INSERT INTO public.clients (name)
SELECT DISTINCT client
FROM   public.projects
WHERE  client IS NOT NULL
  AND  client <> ''
  AND  client <> 'Internal'
ON CONFLICT DO NOTHING;

-- 4. Add client_id FK column to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- 5. Backfill client_id from existing text values
UPDATE public.projects p
SET    client_id = c.id
FROM   public.clients c
WHERE  c.name = p.client;
