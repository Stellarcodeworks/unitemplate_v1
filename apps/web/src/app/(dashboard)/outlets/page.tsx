import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/lib/auth/resolve-user-context";
import { hasRole } from "@eop/access";
import { ROUTES } from "@/lib/constants";
import { OutletList } from "@/components/outlets/outlet-list";

/**
 * Outlet list page — Pattern A (RSC-first).
 * Server Component: fetches outlets, passes data to client component.
 * Minimum role: org_admin.
 */
export default async function OutletsPage() {
    const supabase = await createSupabaseServerClient();
    const ctx = await resolveUserContext(supabase);

    // Role gate: org_admin+ required
    if (!hasRole(ctx, "org_admin")) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    // Fetch outlets with organization names (RLS scopes automatically)
    const { data: outlets, error } = await supabase
        .from("outlets")
        .select("*, organizations(name)")
        .order("name");

    if (error) {
        throw new Error(`Failed to fetch outlets: ${error.message}`);
    }

    return <OutletList outlets={outlets ?? []} />;
}
