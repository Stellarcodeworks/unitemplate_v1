import { describe, it, expect } from 'vitest';
import { hasRole, canAccessOutlet, canAssignRole, getHighestRole, requireRole } from '../roles';
import type { UserContext } from '../types';

// ── Test Fixtures ──────────────────────────────────────────────

const mockUser = {
    id: "mock-id",
    email: "test@example.com",
    full_name: "Test User",
    avatar_url: null,
    app_role: "staff",
};

const superAdmin: UserContext = {
    userId: 'super-1',
    isSuperAdmin: true,
    outletRoles: [],
    user: { ...mockUser, id: 'super-1', app_role: 'super_admin' },
};

const orgAdmin: UserContext = {
    userId: 'org-1',
    isSuperAdmin: false,
    outletRoles: [
        { outletId: 'outlet-a', role: 'org_admin' },
        { outletId: 'outlet-b', role: 'org_admin' },
    ],
    user: { ...mockUser, id: 'org-1', app_role: 'org_admin' },
};

const outletAdmin: UserContext = {
    userId: 'oa-1',
    isSuperAdmin: false,
    outletRoles: [{ outletId: 'outlet-a', role: 'outlet_admin' }],
    user: { ...mockUser, id: 'oa-1', app_role: 'outlet_admin' },
};

const manager: UserContext = {
    userId: 'mgr-1',
    isSuperAdmin: false,
    outletRoles: [{ outletId: 'outlet-a', role: 'manager' }],
    user: { ...mockUser, id: 'mgr-1', app_role: 'manager' },
};

const staff: UserContext = {
    userId: 'staff-1',
    isSuperAdmin: false,
    outletRoles: [{ outletId: 'outlet-a', role: 'staff' }],
    user: { ...mockUser, id: 'staff-1', app_role: 'staff' },
};

const multiOutlet: UserContext = {
    userId: 'multi-1',
    isSuperAdmin: false,
    outletRoles: [
        { outletId: 'outlet-a', role: 'manager' },
        { outletId: 'outlet-b', role: 'staff' },
    ],
    user: { ...mockUser, id: 'multi-1', app_role: 'manager' },
};

// ...



// ── hasRole ─────────────────────────────────────────────────────

describe('hasRole', () => {
    it('super_admin bypasses all checks', () => {
        expect(hasRole(superAdmin, 'org_admin')).toBe(true);
        expect(hasRole(superAdmin, 'super_admin')).toBe(true);
    });

    it('org_admin has org_admin role', () => {
        expect(hasRole(orgAdmin, 'org_admin')).toBe(true);
    });

    it('org_admin has lower roles', () => {
        expect(hasRole(orgAdmin, 'manager')).toBe(true);
        expect(hasRole(orgAdmin, 'staff')).toBe(true);
    });

    it('staff does not have manager role', () => {
        expect(hasRole(staff, 'manager')).toBe(false);
    });

    it('checks role scoped to specific outlet', () => {
        expect(hasRole(multiOutlet, 'manager', 'outlet-a')).toBe(true);
        expect(hasRole(multiOutlet, 'manager', 'outlet-b')).toBe(false);
        expect(hasRole(multiOutlet, 'staff', 'outlet-b')).toBe(true);
    });

    it('returns false for unknown outlet', () => {
        expect(hasRole(staff, 'staff', 'outlet-unknown')).toBe(false);
    });

    it('without outletId, checks if ANY outlet meets requirement', () => {
        expect(hasRole(multiOutlet, 'manager')).toBe(true);
        expect(hasRole(multiOutlet, 'outlet_admin')).toBe(false);
    });
});

// ── canAccessOutlet ─────────────────────────────────────────────

describe('canAccessOutlet', () => {
    it('super_admin can access all outlets', () => {
        expect(canAccessOutlet(superAdmin, 'any-outlet')).toBe(true);
    });

    it('user can access their assigned outlet', () => {
        expect(canAccessOutlet(staff, 'outlet-a')).toBe(true);
    });

    it('user cannot access unassigned outlet', () => {
        expect(canAccessOutlet(staff, 'outlet-b')).toBe(false);
    });

    it('multi-outlet user can access both outlets', () => {
        expect(canAccessOutlet(multiOutlet, 'outlet-a')).toBe(true);
        expect(canAccessOutlet(multiOutlet, 'outlet-b')).toBe(true);
    });
});

// ── canAssignRole ───────────────────────────────────────────────

describe('canAssignRole', () => {
    it('manager cannot assign org_admin', () => {
        expect(canAssignRole('manager', 'org_admin')).toBe(false);
    });

    it('org_admin can assign manager', () => {
        expect(canAssignRole('org_admin', 'manager')).toBe(true);
    });

    it('outlet_admin cannot assign outlet_admin (equal)', () => {
        expect(canAssignRole('outlet_admin', 'outlet_admin')).toBe(false);
    });

    it('nobody can assign super_admin', () => {
        expect(canAssignRole('super_admin', 'super_admin')).toBe(false);
        expect(canAssignRole('org_admin', 'super_admin')).toBe(false);
    });

    it('super_admin can assign org_admin', () => {
        expect(canAssignRole('super_admin', 'org_admin')).toBe(true);
    });

    it('org_admin can assign outlet_admin', () => {
        expect(canAssignRole('org_admin', 'outlet_admin')).toBe(true);
    });

    it('staff cannot assign anything', () => {
        expect(canAssignRole('staff', 'staff')).toBe(false);
        expect(canAssignRole('staff', 'manager')).toBe(false);
    });
});

// ── getHighestRole ──────────────────────────────────────────────

describe('getHighestRole', () => {
    it('returns super_admin for super admin user', () => {
        expect(getHighestRole(superAdmin)).toBe('super_admin');
    });

    it('returns highest role from outlet roles', () => {
        expect(getHighestRole(multiOutlet)).toBe('manager');
    });

    it('returns the single role for single-outlet user', () => {
        expect(getHighestRole(staff)).toBe('staff');
        expect(getHighestRole(outletAdmin)).toBe('outlet_admin');
    });

    it('returns undefined for user with no roles or super_admin', () => {
        const noRoles: UserContext = {
            userId: 'empty-1',
            isSuperAdmin: false,
            outletRoles: [],
            user: { ...mockUser, id: 'empty-1', app_role: 'staff' },
        };
        expect(getHighestRole(noRoles)).toBeUndefined();
    });
});

// ── requireRole ─────────────────────────────────────────────────

describe('requireRole', () => {
    it('does not throw when role is sufficient', () => {
        expect(() => requireRole(orgAdmin, 'manager')).not.toThrow();
    });

    it('throws for insufficient role', () => {
        expect(() => requireRole(staff, 'manager')).toThrow('Insufficient permissions');
    });

    it('throws with outlet context in error message', () => {
        expect(() => requireRole(staff, 'org_admin', 'outlet-a')).toThrow('for outlet outlet-a');
    });

    it('super_admin never throws', () => {
        expect(() => requireRole(superAdmin, 'super_admin')).not.toThrow();
    });

    it('manager can access manager-level', () => {
        expect(() => requireRole(manager, 'manager')).not.toThrow();
        expect(() => requireRole(manager, 'outlet_admin')).toThrow('Insufficient permissions');
    });
});
