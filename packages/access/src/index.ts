/**
 * @eop/access — RBAC logic (roles, permissions, hierarchy)
 */
export type { Role, UserContext, OutletRole } from './types';
export { ROLE_HIERARCHY, ALL_ROLES } from './types';
export { hasRole, canAccessOutlet, canAssignRole, getHighestRole, requireRole } from './roles';
