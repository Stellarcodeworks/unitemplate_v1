-- =============================================================
-- Migration 015: Organization Management
-- =============================================================
-- Enables Super Admins to manage organizations (CRUD).
-- Defines `is_super_admin()` helper function.
-- Updates RLS policies for `organizations` table.
-- =============================================================

-- ── 1. Helper Function: is_super_admin ───────────────────────

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.outlet_users
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;

-- ── 2. Update Select Policy ──────────────────────────────────

-- Drop existing policy to redefine it with super_admin check
DROP POLICY IF EXISTS "Organizations are viewable by members" ON public.organizations;

CREATE POLICY "Organizations are viewable by members or super_admin"
ON public.organizations FOR SELECT
TO authenticated
USING (
    public.is_super_admin()
    OR
    EXISTS (
        SELECT 1 FROM public.outlets o
        JOIN public.outlet_users ou ON ou.outlet_id = o.id
        WHERE o.organization_id = public.organizations.id
        AND ou.user_id = auth.uid()
    )
);

-- ── 3. Insert/Update/Delete Policies ─────────────────────────

-- Only Super Admins can insert organizations
CREATE POLICY "Super Admins can insert organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (
    public.is_super_admin()
);

-- Only Super Admins can update organizations
CREATE POLICY "Super Admins can update organizations"
ON public.organizations FOR UPDATE
TO authenticated
USING (
    public.is_super_admin()
)
WITH CHECK (
    public.is_super_admin()
);

-- Only Super Admins can delete organizations
CREATE POLICY "Super Admins can delete organizations"
ON public.organizations FOR DELETE
TO authenticated
USING (
    public.is_super_admin()
);
