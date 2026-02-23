import { cookies } from "next/headers";
import { createServerClient } from "@eop/db";
import { env } from "@/lib/env";

/**
 * Create a Supabase server client for use in RSC / Server Actions / Route Handlers.
 * Uses Next.js `cookies()` as the cookie store.
 * All Supabase client creation flows through @eop/db.
 */
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient({
        supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options as Record<string, unknown>);
                    });
                } catch {
                    // `setAll` can throw in Server Components when called during render.
                    // This is safe to ignore — the middleware will handle cookie updates.
                }
            },
        },
    });
}
