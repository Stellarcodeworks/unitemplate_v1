-- =============================================================
-- Migration 013: FORCE ROW LEVEL SECURITY
-- =============================================================
-- Ensures even the table owner (postgres role) respects RLS.
-- =============================================================

ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.outlets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
