-- =============================================================
-- Migration 012: Add created_by to organizations
-- =============================================================
-- Normalizes schema: all assignable entities now have created_by.
-- Uses 3-step approach to handle existing rows.
-- =============================================================

-- Step 1: Add column as nullable with default
ALTER TABLE public.organizations
ADD COLUMN created_by UUID DEFAULT auth.uid();

-- Step 2: Backfill existing rows with system UUID
UPDATE public.organizations
SET created_by = '00000000-0000-0000-0000-000000000000'
WHERE created_by IS NULL;

-- Step 3: Set NOT NULL constraint
ALTER TABLE public.organizations
ALTER COLUMN created_by SET NOT NULL;
