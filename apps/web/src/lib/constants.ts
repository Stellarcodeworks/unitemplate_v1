import type { Role } from "@eop/access";

/**
 * Route path constants.
 */
export const ROUTES = {
    LOGIN: "/login",
    UNAUTHORIZED: "/unauthorized",
    HOME: "/",
    OUTLETS: "/outlets",
    USERS: "/users",
    AUDIT: "/audit",
    SETTINGS: "/settings",
    AUTH_CALLBACK: "/api/auth/callback",
} as const;

/**
 * Public routes that skip authentication in middleware.
 */
export const PUBLIC_ROUTES = [
    ROUTES.LOGIN,
    ROUTES.UNAUTHORIZED,
    ROUTES.AUTH_CALLBACK,
] as const;

/**
 * Human-readable role labels.
 */
export const ROLE_LABELS: Record<Role, string> = {
    staff: "Staff",
    manager: "Manager",
    outlet_admin: "Outlet Admin",
    org_admin: "Org Admin",
    super_admin: "Super Admin",
};
