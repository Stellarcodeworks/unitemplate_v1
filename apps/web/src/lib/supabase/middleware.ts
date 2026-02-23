import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@eop/db";

// Edge runtime requires inline process.env access for Next.js 
// to correctly statically replace the values during compilation.

/**
 * Create a Supabase client for use in Next.js middleware.
 * Adapts NextRequest/NextResponse cookies into @eop/db's createServerClient.
 *
 * Returns the user (if authenticated) and the response with updated cookies.
 * All Supabase client creation flows through @eop/db — no direct @supabase/ssr imports.
 */
export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                // Write to request cookies (for downstream server components in this request)
                cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                });
                // Recreate response to carry updated request cookies
                response = NextResponse.next({ request });
                // Write to response cookies (to send updated tokens to the browser)
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options as Record<string, unknown>);
                });
            },
        }
    });

    // This call refreshes the session if the token is expired.
    // If refresh fails, user will be null.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return { user, response, supabase };
}
