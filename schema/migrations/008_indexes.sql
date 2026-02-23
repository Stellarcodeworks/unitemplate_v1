-- =============================================================
-- Migration 008: Indexes
-- =============================================================
-- Optimizes common lookups:
-- 1. outlet_users(user_id) -> finding user's outlets
-- 2. outlet_users(outlet_id) -> finding outlet's users
-- 3. outlets(organization_id) -> finding org's outlets
-- 4. audit_logs(record_id) -> history for a record
-- =============================================================

CREATE INDEX idx_outlet_users_user_id ON public.outlet_users(user_id);
CREATE INDEX idx_outlet_users_outlet_id ON public.outlet_users(outlet_id);

CREATE INDEX idx_outlets_organization_id ON public.outlets(organization_id);

CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_performed_by ON public.audit_logs(performed_by);
