import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

/**
 * Create a Supabase client with the SERVICE ROLE key.
 * ⚠️  SERVER-ONLY — never expose this to the browser.
 * The application layer is responsible for providing the environment variables.
 *
 * This client bypasses RLS and should only be used in:
 * - Edge Functions
 * - Server-side API routes
 * - Migration scripts
 */
export function createServiceClient(config: { supabaseUrl: string; serviceRoleKey: string }) {
    if (!config.supabaseUrl || !config.serviceRoleKey) {
        throw new Error('Missing Supabase environment variables (URL or Service Role Key).');
    }

    return createClient<Database>(config.supabaseUrl, config.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
