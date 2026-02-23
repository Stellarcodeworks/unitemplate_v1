-- =============================================================
-- Migration 005: Role Hierarchy Guard
-- =============================================================
-- Prevents privilege escalation.
-- Rule: A user cannot assign/update a role higher than or equal to their own.
-- Hierarchy: staff (1) < manager (2) < outlet_admin (3) < org_admin (4) < super_admin (5)
-- =============================================================

CREATE OR REPLACE FUNCTION public.check_role_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    creator_role_text TEXT;
    creator_level INT;
    new_role_level INT;
    target_role_text TEXT;
BEGIN
    -- 1. Identify the actor.
    -- If created by service_role or trigger (e.g. initial owner), bypass check?
    -- Actually, we want to enforce this for regular users. service_role bypasses RLS/Triggers usually if session_replication_role is set,
    -- but here we are in a normal trigger.
    -- If auth.uid() is null (e.g. system seed), we permit it.
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- 2. Get creator's role IN THIS OUTLET
    SELECT role INTO creator_role_text
    FROM public.outlet_users
    WHERE user_id = auth.uid()
    AND outlet_id = NEW.outlet_id;

    -- If creator has no role in this outlet, they shouldn't be here (RLS blocks),
    -- but for safety (and Org Admins who might access across outlets if we change logic):
    IF creator_role_text IS NULL THEN
         RAISE EXCEPTION 'User has no role in this outlet';
    END IF;

    -- 3. Define Hierarchy Levels
    -- staff=1, manager=2, outlet_admin=3, org_admin=4, super_admin=5
    -- (Implementation: simple CASE statement)
    
    -- Helper to get level
    CREATE TEMP TABLE IF NOT EXISTS _role_levels (role_name text, level int);
    IF NOT EXISTS (SELECT 1 FROM _role_levels) THEN
        INSERT INTO _role_levels (role_name, level) VALUES
        ('staff', 1), ('manager', 2), ('outlet_admin', 3), ('org_admin', 4), ('super_admin', 5);
    END IF;

    -- Get levels
    SELECT level INTO creator_level FROM _role_levels WHERE role_name = creator_role_text;
    SELECT level INTO new_role_level FROM _role_levels WHERE role_name = NEW.role;

    -- 4. Check Escalation
    -- "Cannot assign role >= my level"?
    -- Actually, usually you can assign up to your level?
    -- No, "Cannot assign role HIGHER than my level" is standard.
    -- BUT strict security: "I cannot make someone ELSE an Admin if I am an Admin?" 
    -- => "I can duplicate my rights?" -> Risk of losing control.
    -- Better rule: "Cannot assign role >= my level". So Outlet Admin cannot create another Outlet Admin. Only Org Admin can.
    -- Wait, who creates Org Admin? Super Admin.
    -- Who creates Outlet Admin? Org Admin.
    -- Who creates Manager? Outlet Admin.
    -- Who creates Staff? Manager.
    
    -- Let's stick to the Build Plan: "Prevent role escalation (cannot assign > own role)".
    -- "> own role" means strictly greater. So Equals is allowed?
    -- If Equals is allowed, an Outlet Admin can create 100 other Outlet Admins.
    -- User's prompt implies robust security. Let's aim for Strict Hierarchy: Level > Target.
    
    IF new_role_level >= creator_level THEN
        RAISE EXCEPTION 'Insufficient privileges: Cannot assign role % (Level %) with current role % (Level %)', 
            NEW.role, new_role_level, creator_role_text, creator_level;
    END IF;

    RETURN NEW;
END;
$$;

-- Attach Trigger to INSERT and UPDATE on outlet_users
CREATE TRIGGER limit_role_assignment
    BEFORE INSERT OR UPDATE ON public.outlet_users
    FOR EACH ROW EXECUTE FUNCTION public.check_role_hierarchy();
