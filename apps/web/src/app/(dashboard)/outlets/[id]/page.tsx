import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/lib/auth/resolve-user-context";
import { canAccessOutlet, hasRole } from "@eop/access";
import { ROUTES } from "@/lib/constants";
import { OutletDetailCard } from "@/components/outlets/outlet-detail-card";

/**
 * Outlet detail page — Pattern A (RSC-first).
 * Server Component: fetches outlet + members, passes data to client.
 * Minimum role: outlet_admin for this specific outlet.
 */
export default async function OutletDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Strict UUID validation — reject before hitting DB
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(id)) {
        notFound();
    }

    const supabase = await createSupabaseServerClient();
    const ctx = await resolveUserContext(supabase);

    // Access gate: must have access to this outlet
    if (!canAccessOutlet(ctx, id)) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    // Role gate: outlet_admin+ required for this outlet
    if (!hasRole(ctx, "outlet_admin", id)) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    // Fetch outlet details
    const { data: outlet, error: outletError } = await supabase
        .from("outlets")
        .select("*, organizations(name)")
        .eq("id", id)
        .single();

    if (outletError || !outlet) {
        notFound();
    }

    // Fetch outlet members with profiles
    const { data: members, error: membersError } = await supabase
        .from("outlet_users")
        .select("*, profiles(full_name, email)")
        .eq("outlet_id", id);

    if (membersError) {
        throw new Error(`Failed to fetch members: ${membersError.message}`);
    }

    return (
        <OutletDetailCard
            outlet={outlet}
            members={members ?? []}
        />
    );
}
