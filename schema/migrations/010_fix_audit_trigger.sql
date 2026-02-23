-- =============================================================
-- Migration 010: Fix Audit Trigger (Handle System Actions)
-- =============================================================
-- Updates log_audit_event to handle cases where auth.uid() is NULL
-- (e.g. system seeds, background jobs). Defaults to 0000... UUID.
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

    -- Insert with COALESCE for system actions
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
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    );

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;
