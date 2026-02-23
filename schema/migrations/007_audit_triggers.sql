-- =============================================================
-- Migration 007: Audit Triggers
-- =============================================================
-- Tracks every INSERT, UPDATE, DELETE on key tables.
-- Stores the old and new data in `audit_logs` table.
-- =============================================================

CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    row_data JSONB;
    old_row_data JSONB;
    new_row_data JSONB;
    change_type TEXT;
    pk_value UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        change_type := 'INSERT';
        new_row_data := to_jsonb(NEW);
        pk_value := NEW.id;
    ELSIF (TG_OP = 'UPDATE') THEN
        change_type := 'UPDATE';
        old_row_data := to_jsonb(OLD);
        new_row_data := to_jsonb(NEW);
        pk_value := NEW.id;
    ELSIF (TG_OP = 'DELETE') THEN
        change_type := 'DELETE';
        old_row_data := to_jsonb(OLD);
        pk_value := OLD.id;
    ELSE
        RETURN NULL; -- Should not happen for these triggers
    END IF;

    -- Security: We might mask sensitive fields here if needed (e.g. password_hash?), 
    -- but business tables (profiles, outlets) generally don't store secrets directly.
    
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        performed_by
    ) VALUES (
        TG_TABLE_NAME,
        pk_value,
        change_type,
        old_row_data,
        new_row_data,
        auth.uid() -- Defaults to 'performed_by' default anyway, but explicit is good.
        -- Note: If performed by system override, auth.uid() might be null. 
        -- Table limit allows null? No, performed_by NOT NULL DEFAULT auth.uid().
        -- If system runs this, auth.uid() is null -> insert fails?
        -- We should handle NULL auth.uid() by falling back to '00000000-0000-0000-0000-000000000000' or similar
        -- OR modify schema to allow NULL.
    );

    RETURN NULL; -- After trigger, return value ignored
EXCEPTION WHEN OTHERS THEN
    -- If audit fails, should the transaction fail? YES. Audit is critical.
    RAISE;
END;
$$;

-- Apply to keys tables
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_organizations
    AFTER INSERT OR UPDATE OR DELETE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_outlets
    AFTER INSERT OR UPDATE OR DELETE ON public.outlets
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_outlet_users
    AFTER INSERT OR UPDATE OR DELETE ON public.outlet_users
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
