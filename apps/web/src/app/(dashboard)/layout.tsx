import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/lib/auth/resolve-user-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ROUTES } from "@/lib/constants";

/**
 * Dashboard layout — Server Component.
 *
 * Responsibilities:
 * 1. Verify authentication (redundant with proxy, but defense-in-depth)
 * 2. Resolve UserContext from the database
 * 3. Pass resolved context to the client-side DashboardShell
 *
 * This is the only place where UserContext is resolved.
 * All downstream components read it from the UserContextProvider.
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createSupabaseServerClient();

    // Verify auth (defense-in-depth — proxy should have already caught this)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(ROUTES.LOGIN);
    }

    // Resolve full user context from the database
    const userContext = await resolveUserContext(supabase);

    return (
        <DashboardShell
            userContext={userContext}
            userEmail={user.email ?? "Unknown"}
        >
            {children}
        </DashboardShell>
    );
}
