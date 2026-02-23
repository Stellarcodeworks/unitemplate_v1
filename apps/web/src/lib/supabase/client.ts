import { createBrowserClient } from "@eop/db";
import { type SupabaseClient } from "@supabase/supabase-js";
import { type Database } from "@eop/db";
import { env } from "@/lib/env";

/**
 * Singleton Supabase browser client.
 * All Supabase client creation flows through @eop/db.
 */
let client: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient() {
    if (!client) {
        client = createBrowserClient({
            supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }) as unknown as SupabaseClient<Database>;
    }
    return client;
}
