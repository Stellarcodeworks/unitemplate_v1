/**
 * RBAC type definitions for the EOP platform.
 */

/**
 * All roles in the system, ordered from least to most privileged.
 */
export type Role = 'staff' | 'manager' | 'outlet_admin' | 'org_admin' | 'super_admin';

/**
 * Numeric hierarchy for role comparison.
 * Higher number = more privileged.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
    staff: 1,
    manager: 2,
    outlet_admin: 3,
    org_admin: 4,
    super_admin: 5,
} as const;

/**
 * All valid roles as an array, ordered by privilege.
 */
export const ALL_ROLES: readonly Role[] = [
    'staff',
    'manager',
    'outlet_admin',
    'org_admin',
    'super_admin',
] as const;

/**
 * A user's role assignment within a specific outlet.
 */
export interface OutletRole {
    outletId: string;
    role: Role;
    outlet_name?: string;
    org_name?: string;
}

/**
 * User profile shape exposed in context.
 * Combines DB profile data with derived access info.
 */
export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    app_role: Role | string;
}

/**
 * Full user context resolved from the database.
 * Supports multi-outlet role assignments.
 */
export interface UserContext {
    userId: string;
    isSuperAdmin: boolean;
    outletRoles: OutletRole[];
    user: UserProfile;
}
