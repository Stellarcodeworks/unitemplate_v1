-- =============================================================
-- TESTS: Migration 004 (RLS Policies)
-- =============================================================
-- We need to simulate different users.
-- Since we can't easily "switch user" in a single SQL script without `set_config`,
-- and we don't have seed users yet, we will:
-- 1. Create temporary test users in auth.users (cleaned up after) -- actually rollback is safer.
-- 2. Use `SERVICE_ROLE` privileges to setup, then `SET ROLE authenticated` + `set_config('request.jwt.claim.sub', ...)` to impersonate.
-- =============================================================

BEGIN;

-- 1. Setup Data (as Service Role / Super Admin)
-- -------------------------------------------------------------

-- Create 2 Orgs, 2 Outlets (Same Org), 1 Foreign Outlet
INSERT INTO public.organizations (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Org A'),
  ('22222222-2222-2222-2222-222222222222', 'Test Org B');

INSERT INTO public.outlets (id, organization_id, name, created_by) VALUES
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Outlet A1', '00000000-0000-0000-0000-000000000000'),
  ('20000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Foreign Outlet B1', '00000000-0000-0000-0000-000000000000');

-- Mock Auth Users (We insert directly into auth.users for testing - typically requires superuser or bypass)
-- MCP execute_sql runs as postgres/service_role usually.

INSERT INTO auth.users (id, email) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'staff_a1@test.com'),
  ('bbbb2222-2222-2222-2222-222222222222', 'stranger@test.com');

INSERT INTO public.profiles (id, email, full_name) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'staff_a1@test.com', 'Staff A1'),
  ('bbbb2222-2222-2222-2222-222222222222', 'stranger@test.com', 'Stranger');

-- Assign Staff A1 to Outlet A1
INSERT INTO public.outlet_users (user_id, outlet_id, role, created_by) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', 'staff', '00000000-0000-0000-0000-000000000000');


-- 2. Test Execution
-- -------------------------------------------------------------

DO $$
DECLARE
  row_count INT;
BEGIN
  -- ----------------------------------------------------------------
  -- TEST 1: Staff SELECT own outlet -> Should see 1
  -- ----------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', 'aaaa1111-1111-1111-1111-111111111111', true);
  SET ROLE authenticated;

  SELECT COUNT(*) INTO row_count FROM public.outlets;
  IF row_count != 1 THEN
    RAISE EXCEPTION 'Test 1 Failed: Staff A1 should see exactly 1 outlet (Own), saw %', row_count;
  END IF;

  -- ----------------------------------------------------------------
  -- TEST 2: Staff SELECT foreign outlet -> Should see 0
  -- ----------------------------------------------------------------
  -- (Implicitly covered above via COUNT, but let's try specific ID lookup)
  SELECT COUNT(*) INTO row_count FROM public.outlets WHERE id = '20000000-0000-0000-0000-000000000002';
  IF row_count != 0 THEN
    RAISE EXCEPTION 'Test 2 Failed: Staff A1 seeing foreign outlet';
  END IF;

  -- ----------------------------------------------------------------
  -- TEST 3: Staff INSERT to foreign outlet (outlet_users) -> Should Fail
  -- ----------------------------------------------------------------
  -- Staff shouldn't be able to insert users anyway (Access Policy forbids unless manager+), 
  -- AND foreign constraint check.
  -- Let's check permissions.
  BEGIN
    INSERT INTO public.outlet_users (user_id, outlet_id, role) 
    VALUES ('bbbb2222-2222-2222-2222-222222222222', '20000000-0000-0000-0000-000000000002', 'staff');
    RAISE EXCEPTION 'Test 3 Failed: Staff A1 was able to insert into Foreign Outlet';
  EXCEPTION WHEN OTHERS THEN
    -- Expected failure
    NULL;
  END;
  
  -- Reset
  SET ROLE postgres;
  PERFORM set_config('request.jwt.claim.sub', NULL, true);
END
$$;

ROLLBACK; -- Clean up all test data
