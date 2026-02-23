import { NextResponse } from "next/server";

/**
 * OAuth callback route handler.
 * Future-proofing for OAuth providers (Google, GitHub, etc.).
 * Currently a no-op placeholder — Supabase SSR handles the token exchange
 * via the middleware session refresh.
 */
export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    // Redirect to dashboard after auth callback
    return NextResponse.redirect(`${origin}/`);
}
