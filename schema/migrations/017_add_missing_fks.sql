-- =============================================================
-- Migration 017: Add missing foreign keys to Profiles
-- =============================================================
-- 1. Makes audit_logs.performed_by nullable to allow system actions
-- 2. Modifies the audit trigger to insert NULL instead of a fake UUID
-- 3. Adds the missing Foreign Key constraints to profiles
-- =============================================================

-- Step 1: Allow NULL for system actors in audit logs
ALTER TABLE public.audit_logs ALTER COLUMN performed_by DROP NOT NULL;

-- Step 2: Clean up any existing system logs that used the nil UUID
UPDATE public.audit_logs 
SET performed_by = NULL 
WHERE performed_by = '00000000-0000-0000-0000-000000000000';

-- Step 3: Update the Audit Trigger to insert NULL instead of the nil UUID
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
        RETURN NULL;
    END IF;

    -- Insert with actual auth.uid() or NULL for system actions
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
        auth.uid()
    );

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Step 4: Now safe to add Foreign Keys
ALTER TABLE public.outlet_users
  ADD CONSTRAINT outlet_users_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_performed_by_fkey
  FOREIGN KEY (performed_by) REFERENCES public.profiles(id)
  ON DELETE SET NULL;
