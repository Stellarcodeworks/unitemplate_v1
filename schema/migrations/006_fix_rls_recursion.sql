-- =============================================================
-- Migration 006: Fix RLS Recursion
-- =============================================================
-- Usage of direct subqueries on `outlet_users` inside its own policies
-- caused infinite recursion. We fix this by wrapping the check in a 
-- SECURITY DEFINER function which bypasses RLS for the check.
-- =============================================================

-- 1. Create Helper to check Admin status (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_admin_role_in_outlet(_outlet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.outlet_users
    WHERE outlet_id = _outlet_id
    AND user_id = auth.uid()
    AND role IN ('outlet_admin', 'org_admin', 'manager')
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_admin_role_in_outlet TO authenticated;

-- 2. Drop specific policies that were causing issues
DROP POLICY IF EXISTS "Admins can add users to their outlet" ON public.outlet_users;
DROP POLICY IF EXISTS "Admins can update users in their outlet" ON public.outlet_users;
DROP POLICY IF EXISTS "Admins can remove users from their outlet" ON public.outlet_users;

-- 3. Re-create policies using the safe function

CREATE POLICY "Admins can add users to their outlet"
ON public.outlet_users FOR INSERT
TO authenticated
WITH CHECK (
    public.has_admin_role_in_outlet(outlet_id)
);

CREATE POLICY "Admins can update users in their outlet"
ON public.outlet_users FOR UPDATE
TO authenticated
USING (
    public.has_admin_role_in_outlet(outlet_id)
)
WITH CHECK (
    public.has_admin_role_in_outlet(outlet_id)
);

CREATE POLICY "Admins can remove users from their outlet"
ON public.outlet_users FOR DELETE
TO authenticated
USING (
    public.has_admin_role_in_outlet(outlet_id)
);
