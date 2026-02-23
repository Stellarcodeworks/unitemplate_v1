-- =============================================================
-- Migration 001: Initial Schema
-- =============================================================
-- Creates the core tables for the EOP platform:
--   organizations, outlets, profiles, outlet_users, audit_logs
-- =============================================================

-- ── Organizations ───────────────────────────────────────────

CREATE TABLE public.organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.organizations IS 'Top-level organizational entities';

-- ── Outlets (branches / locations) ──────────────────────────

CREATE TABLE public.outlets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    address         TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NOT NULL DEFAULT auth.uid()
);

COMMENT ON TABLE public.outlets IS 'Physical locations / branches within an organization';

-- ── Profiles ────────────────────────────────────────────────

CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    full_name   TEXT NOT NULL,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profile data, linked 1:1 to auth.users';

-- ── Outlet Users (role assignments) ─────────────────────────

CREATE TABLE public.outlet_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    outlet_id   UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('staff', 'manager', 'outlet_admin', 'org_admin', 'super_admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  UUID NOT NULL DEFAULT auth.uid(),

    -- A user can only have one role per outlet
    UNIQUE (user_id, outlet_id)
);

COMMENT ON TABLE public.outlet_users IS 'Maps users to outlets with their assigned role';

-- ── Audit Logs ──────────────────────────────────────────────

CREATE TABLE public.audit_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name    TEXT NOT NULL,
    record_id     UUID NOT NULL,
    action        TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data      JSONB,
    new_data      JSONB,
    performed_by  UUID NOT NULL DEFAULT auth.uid(),
    performed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail for all business table changes';

-- ── Auto-update updated_at trigger ──────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.outlets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
