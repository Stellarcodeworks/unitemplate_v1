-- =============================================================
-- Migration 014: Org-Wide Audit Visibility
-- =============================================================
-- 1. Adds organization_id to audit_logs for efficient filtering.
-- 2. Updates log_audit_event trigger to populate organization_id.
-- 3. Adds RLS policy for Org Admins to view their org's logs.
-- =============================================================

-- ── 1. Schema Changes ────────────────────────────────────────

ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);

-- ── 2. Update Trigger Function ───────────────────────────────

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
    target_org_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        change_type := 'INSERT';
        new_row_data := to_jsonb(NEW);
        pk_value := NEW.id;
        
        -- Resolve Organization ID for INSERT
        IF (TG_TABLE_NAME = 'organizations') THEN
            target_org_id := NEW.id;
        ELSIF (TG_TABLE_NAME = 'outlets') THEN
            target_org_id := NEW.organization_id;
        ELSIF (TG_TABLE_NAME = 'outlet_users') THEN
            SELECT organization_id INTO target_org_id FROM public.outlets WHERE id = NEW.outlet_id;
        END IF;

    ELSIF (TG_OP = 'UPDATE') THEN
        change_type := 'UPDATE';
        old_row_data := to_jsonb(OLD);
        new_row_data := to_jsonb(NEW);
        pk_value := NEW.id;

        -- Resolve Organization ID for UPDATE
        IF (TG_TABLE_NAME = 'organizations') THEN
            target_org_id := NEW.id;
        ELSIF (TG_TABLE_NAME = 'outlets') THEN
            target_org_id := NEW.organization_id;
        ELSIF (TG_TABLE_NAME = 'outlet_users') THEN
            SELECT organization_id INTO target_org_id FROM public.outlets WHERE id = NEW.outlet_id;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        change_type := 'DELETE';
        old_row_data := to_jsonb(OLD);
        pk_value := OLD.id;

        -- Resolve Organization ID for DELETE
        IF (TG_TABLE_NAME = 'organizations') THEN
            target_org_id := OLD.id;
        ELSIF (TG_TABLE_NAME = 'outlets') THEN
            target_org_id := OLD.organization_id;
        ELSIF (TG_TABLE_NAME = 'outlet_users') THEN
            SELECT organization_id INTO target_org_id FROM public.outlets WHERE id = OLD.outlet_id;
        END IF;

    ELSE
        RETURN NULL;
    END IF;

    -- Insert into audit_logs
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        performed_by,
        organization_id
    ) VALUES (
        TG_TABLE_NAME,
        pk_value,
        change_type,
        old_row_data,
        new_row_data,
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        target_org_id
    );

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ── 3. Add RLS Policy ────────────────────────────────────────

CREATE POLICY "Org Admins can view org logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT o.organization_id 
        FROM public.outlet_users ou
        JOIN public.outlets o ON o.id = ou.outlet_id
        WHERE ou.user_id = auth.uid()
        AND ou.role IN ('org_admin', 'super_admin') 
    )
);
