-- =============================================================
-- SEED DATA
-- =============================================================
-- Creates:
-- 1 Organization: "Acme Corp"
-- 3 Outlets: "HQ", "North Branch", "South Branch"
-- 5 Users:
--   - super@acme.com (Super Admin @ HQ)
--   - org@acme.com (Org Admin @ HQ)
--   - outlet@acme.com (Outlet Admin @ North Branch)
--   - manager@acme.com (Manager @ South Branch)
--   - staff@acme.com (Staff @ South Branch)
-- =============================================================

BEGIN;

-- 1. Org & Outlets
-- ----------------
INSERT INTO public.organizations (id, name) VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Acme Corp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.outlets (id, organization_id, name, created_by) VALUES
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Headquarters', '00000000-0000-0000-0000-000000000000'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'North Branch', '00000000-0000-0000-0000-000000000000'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'South Branch', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;


-- 2. Users (Auth + Profiles)
-- --------------------------
-- Helper to create user if not exists
CREATE OR REPLACE FUNCTION public.create_seed_user(
    _id UUID, 
    _email TEXT, 
    _password TEXT, 
    _name TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Check if user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _id) THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (
            _id, 
            _email, 
            crypt(_password, gen_salt('bf')), 
            now(), 
            '{"provider":"email","providers":["email"]}', 
            jsonb_build_object('full_name', _name),
            now(), 
            now()
        );
        
        -- Profile is usually created trigger, but let's ensure it exists
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (_id, _email, _name)
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
    END IF;
END;
$$;

-- IDs for users
-- Super Admin: 555...
-- Org Admin: 444...
-- Outlet Admin: 333...
-- Manager: 222...
-- Staff: 111...

SELECT public.create_seed_user('55555555-5555-5555-5555-555555555555', 'super@acme.com', 'password123', 'Super Admin');
SELECT public.create_seed_user('44444444-4444-4444-4444-444444444444', 'org@acme.com', 'password123', 'Org Admin');
SELECT public.create_seed_user('33333333-3333-3333-3333-333333333333', 'outlet@acme.com', 'password123', 'Outlet Admin');
SELECT public.create_seed_user('22222222-2222-2222-2222-222222222222', 'manager@acme.com', 'password123', 'Manager');
SELECT public.create_seed_user('11111111-1111-1111-1111-111111111111', 'staff@acme.com', 'password123', 'Staff Member');


-- 3. Roles
-- --------
-- Super Admin @ HQ
INSERT INTO public.outlet_users (user_id, outlet_id, role, created_by)
VALUES ('55555555-5555-5555-5555-555555555555', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'super_admin', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Org Admin @ HQ
INSERT INTO public.outlet_users (user_id, outlet_id, role, created_by)
VALUES ('44444444-4444-4444-4444-444444444444', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'org_admin', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Outlet Admin @ North Branch
INSERT INTO public.outlet_users (user_id, outlet_id, role, created_by)
VALUES ('33333333-3333-3333-3333-333333333333', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'outlet_admin', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Manager @ South Branch
INSERT INTO public.outlet_users (user_id, outlet_id, role, created_by)
VALUES ('22222222-2222-2222-2222-222222222222', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'manager', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Staff @ South Branch
INSERT INTO public.outlet_users (user_id, outlet_id, role, created_by)
VALUES ('11111111-1111-1111-1111-111111111111', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'staff', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;


-- Cleanup Helper
DROP FUNCTION public.create_seed_user;

COMMIT;
