import { ROLE_HIERARCHY } from './types';
import type { Role, UserContext } from './types';

/**
 * Check if the user has at least the required role level.
 * super_admin bypasses all checks.
 * If outletId is provided, checks the role for that specific outlet.
 * If outletId is omitted, checks if ANY outlet assignment meets the requirement.
 */
export function hasRole(ctx: UserContext, requiredRole: Role, outletId?: string): boolean {
    if (ctx.isSuperAdmin) return true;

    const requiredLevel = ROLE_HIERARCHY[requiredRole];

    if (outletId !== undefined) {
        const assignment = ctx.outletRoles.find((r) => r.outletId === outletId);
        if (!assignment) return false;
        return ROLE_HIERARCHY[assignment.role] >= requiredLevel;
    }

    // No outletId — check if any outlet role meets the requirement
    return ctx.outletRoles.some((r) => ROLE_HIERARCHY[r.role] >= requiredLevel);
}

/**
 * Check if the user can access a specific outlet.
 * super_admin can access all outlets.
 * Other users must have an explicit outlet role assignment.
 */
export function canAccessOutlet(ctx: UserContext, outletId: string): boolean {
    if (ctx.isSuperAdmin) return true;
    return ctx.outletRoles.some((r) => r.outletId === outletId);
}

/**
 * Check if a user with `assignerRole` can assign `targetRole` to another user.
 * Rules:
 * - Cannot assign a role equal to or higher than your own
 * - super_admin can assign any role except super_admin
 */
export function canAssignRole(assignerRole: Role, targetRole: Role): boolean {
    const assignerLevel = ROLE_HIERARCHY[assignerRole];
    const targetLevel = ROLE_HIERARCHY[targetRole];

    // Cannot assign super_admin (only system-level)
    if (targetRole === 'super_admin') return false;

    // Must be strictly higher than the target role
    return assignerLevel > targetLevel;
}

/**
 * Get the highest role from a user context.
 * Returns 'super_admin' if isSuperAdmin is true.
 * Returns undefined if the user has no outlet roles and is not super_admin.
 */
export function getHighestRole(ctx: UserContext): Role | undefined {
    if (ctx.isSuperAdmin) return 'super_admin';
    if (ctx.outletRoles.length === 0) return undefined;

    return ctx.outletRoles.reduce<Role>((highest, current) => {
        return ROLE_HIERARCHY[current.role] > ROLE_HIERARCHY[highest] ? current.role : highest;
    }, ctx.outletRoles[0]!.role);
}

/**
 * Assert that the user has at least the required role.
 * Throws an error if the check fails.
 */
export function requireRole(ctx: UserContext, requiredRole: Role, outletId?: string): void {
    if (!hasRole(ctx, requiredRole, outletId)) {
        throw new Error(
            `Insufficient permissions: requires ${requiredRole}` +
            (outletId !== undefined ? ` for outlet ${outletId}` : ''),
        );
    }
}
