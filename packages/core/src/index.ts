/**
 * @eop/core — Auth hooks, query client, Zod schemas
 */

// Auth
export { AuthProvider, useAuth } from './auth/AuthProvider';
export { useUserContext } from './auth/useUserContext';

// Query
export { createQueryClient } from './query-client';

// Schemas
export {
    profileSchema,
    outletSchema,
    outletUserSchema,
} from './schemas/index';
export type { Profile, Outlet, OutletUser } from './schemas/index';
