import { z } from 'zod';

/**
 * Zod schema for user profiles.
 */
export const profileSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    full_name: z.string().min(1),
    avatar_url: z.string().url().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export type Profile = z.infer<typeof profileSchema>;

/**
 * Zod schema for outlets (branches/locations).
 */
export const outletSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    organization_id: z.string().uuid(),
    address: z.string().nullable(),
    is_active: z.boolean(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

export type Outlet = z.infer<typeof outletSchema>;

/**
 * Zod schema for outlet-user role assignments.
 */
export const outletUserSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    outlet_id: z.string().uuid(),
    role: z.enum(['staff', 'manager', 'outlet_admin', 'org_admin', 'super_admin']),
    created_at: z.string().datetime(),
    created_by: z.string().uuid(),
});

export type OutletUser = z.infer<typeof outletUserSchema>;
