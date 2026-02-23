import type { UserContext } from '@eop/access';

/**
 * STUB — useUserContext is not implemented until Phase 4.
 *
 * The real implementation requires:
 * - Phase 3 schema complete (outlet_users table)
 * - Types generated from Supabase
 * - RLS verified
 *
 * @throws Always throws — do not call in production until Phase 4.
 */
export function useUserContext(): UserContext {
    throw new Error('useUserContext() not implemented until Phase 4 (DB schema required)');
}
