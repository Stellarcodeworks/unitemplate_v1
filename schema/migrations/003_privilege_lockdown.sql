-- =============================================================
-- Migration 003: Privilege Lockdown
-- =============================================================
-- Revokes all default privileges from public/anon/authenticated roles.
-- Grants minimum necessary permissions to 'authenticated' role.
-- RLS policies (Migration 004) will further restrict row access.
-- =============================================================

-- Revoke everything from everyone to start clean
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, postgres, service_role;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Restore super-powers for service_role and postgres/dashboard user
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- Authenticated Users:
-- Can SELECT, INSERT, UPDATE, DELETE on business tables (guarded by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outlets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outlet_users TO authenticated;

-- Audit Logs:
-- Read-only for authenticated users (guarded by RLS)
-- No INSERT/UPDATE/DELETE allowed directly (only via triggers)
GRANT SELECT ON public.audit_logs TO authenticated;

-- Anon Users:
-- No access by default. If we need public pathways (e.g. login), we handle via Auth.
