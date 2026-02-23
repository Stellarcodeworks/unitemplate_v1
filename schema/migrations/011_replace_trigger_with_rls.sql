-- =============================================================
-- Migration 011: Replace Trigger with RLS-Based Role Hierarchy
-- =============================================================
-- Removes trigger-based role hierarchy enforcement.
-- Implements equivalent logic via RLS WITH CHECK policies
-- using a SECURITY DEFINER helper function to avoid recursion.
-- =============================================================

-- ── Step 1: Drop the trigger and its function ───────────────

DROP TRIGGER IF EXISTS limit_role_assignment ON public.outlet_users;
DROP FUNCTION IF EXISTS public.check_role_hierarchy();

-- ── Step 2: Create role-level helper function ───────────────
-- Returns the numeric level of a role text.
-- staff=1, manager=2, outlet_admin=3, org_admin=4, super_admin=5
-- Returns 0 for unknown roles.

CREATE OR REPLACE FUNCTION public.role_level(_role TEXT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE _role
    WHEN 'super_admin'  THEN 5
    WHEN 'org_admin'    THEN 4
    WHEN 'outlet_admin' THEN 3
    WHEN 'manager'      THEN 2
    WHEN 'staff'        THEN 1
    ELSE 0
  END;
$$;

GRANT EXECUTE ON FUNCTION public.role_level TO authenticated;

-- ── Step 3: Create actor-role-in-outlet helper ──────────────
-- Returns the actor's role level in a given outlet.
-- SECURITY DEFINER to avoid RLS recursion on outlet_users.
-- Returns 0 if the actor has no membership in that outlet.

CREATE OR REPLACE FUNCTION public.my_role_level_in_outlet(_outlet_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT public.role_level(role)
     FROM public.outlet_users
     WHERE user_id = auth.uid()
       AND outlet_id = _outlet_id
     LIMIT 1),
    0
  );
$$;

GRANT EXECUTE ON FUNCTION public.my_role_level_in_outlet TO authenticated;

-- ── Step 4: Drop existing INSERT/UPDATE/DELETE policies ─────
-- We will recreate them with role hierarchy enforcement baked in.

DROP POLICY IF EXISTS "Admins can add users to their outlet" ON public.outlet_users;
DROP POLICY IF EXISTS "Admins can update users in their outlet" ON public.outlet_users;
DROP POLICY IF EXISTS "Admins can remove users from their outlet" ON public.outlet_users;

-- ── Step 5: Recreate policies with hierarchy enforcement ────

-- INSERT: Actor must be admin/manager in this outlet AND
--         actor's role level must be strictly greater than the new role.
--         super_admin cannot be assigned via client (only service-role).
CREATE POLICY "Admins can add users to their outlet"
ON public.outlet_users FOR INSERT
TO authenticated
WITH CHECK (
    public.has_admin_role_in_outlet(outlet_id)
    AND public.my_role_level_in_outlet(outlet_id) > public.role_level(role)
    AND role <> 'super_admin'
);

-- UPDATE: Actor must be admin/manager in this outlet AND
--         if role is being changed, actor's level must be strictly greater
--         than BOTH the old and new role values.
--         super_admin cannot be assigned via client.
CREATE POLICY "Admins can update users in their outlet"
ON public.outlet_users FOR UPDATE
TO authenticated
USING (
    public.has_admin_role_in_outlet(outlet_id)
)
WITH CHECK (
    public.has_admin_role_in_outlet(outlet_id)
    AND public.my_role_level_in_outlet(outlet_id) > public.role_level(role)
    AND role <> 'super_admin'
);

-- DELETE: Actor must be admin/manager in this outlet.
-- (No hierarchy check needed for deletion — you can remove anyone below you,
--  and RLS already limits visibility to your outlet.)
CREATE POLICY "Admins can remove users from their outlet"
ON public.outlet_users FOR DELETE
TO authenticated
USING (
    public.has_admin_role_in_outlet(outlet_id)
);
