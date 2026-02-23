import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { PUBLIC_ROUTES, ROUTES } from "@/lib/constants";

/**
 * Next.js proxy (formerly middleware) — handles authentication ONLY.
 * Role checks are NOT performed here (they require DB queries).
 * Role enforcement happens in RSC page components.
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip public routes
    if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Refresh session and check authentication
    const { user, response } = await updateSession(request);

    if (!user) {
        // Unauthenticated → redirect to login
        const loginUrl = new URL(ROUTES.LOGIN, request.url);
        return NextResponse.redirect(loginUrl);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
