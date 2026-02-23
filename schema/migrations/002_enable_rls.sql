-- =============================================================
-- Migration 002: Enable RLS
-- =============================================================
-- Explicitly enable Row Level Security on all tables created in 001.
-- This ensures that by default, no rows are visible/writable until policies are added.
-- =============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
