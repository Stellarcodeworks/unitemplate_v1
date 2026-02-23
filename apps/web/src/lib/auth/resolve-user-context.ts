import type { UserContext, Role } from "@eop/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Resolve the full UserContext for the authenticated user.
 * Server-side only — called from RSC (dashboard layout).
 *
 * This is the web-specific implementation. It does NOT modify @eop/core.
 *
 * Accepts the Supabase client returned by createSupabaseServerClient().
 *
 * @throws Error if no authenticated user (proxy should have caught this)
 */
export async function resolveUserContext(
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<UserContext> {
    // 1. Get the authenticated user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("No authenticated user — proxy should have redirected.");
    }

    // 2. Query all outlet role assignments for this user
    // We also fetch outlet name and organization name for UI context.
    const { data: assignmentsData, error: queryError } = await supabase
        .from("outlet_users")
        .select(`
            outlet_id, 
            role,
            outlets (
                name,
                organizations (
                    name
                )
            )
        `)
        .eq("user_id", user.id);

    if (queryError) {
        throw new Error(`Failed to resolve user context: ${queryError.message}`);
    }

    // Type casting for nested join result
    type AssignmentRow = {
        outlet_id: string;
        role: string;
        outlets: {
            name: string;
            organizations: {
                name: string;
            } | null;
        } | null;
    };

    const assignments = (assignmentsData || []) as unknown as AssignmentRow[];

    // 2b. Fetch Profile (for full_name, avatar)
    const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, email")
        .eq("id", user.id)
        .single();

    const profile = profileData as { full_name: string; avatar_url: string | null; email: string } | null;

    // If profile missing, fallback to auth metadata or placeholder
    const fullName = profile?.full_name || user.user_metadata?.full_name || "Unknown User";
    const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;
    const email = profile?.email || user.email || "";

    // 3. Build UserContext
    const outletRoles = assignments.map((row) => ({
        outletId: row.outlet_id,
        role: row.role as Role,
        outlet_name: row.outlets?.name,
        org_name: row.outlets?.organizations?.name,
    }));

    const isSuperAdmin = outletRoles.some((r: { role: Role }) => r.role === "super_admin");
    const isOrgAdmin = outletRoles.some((r: { role: Role }) => r.role === "org_admin");

    // Derive top-level app role for UI display
    let appRole = "staff";
    if (isSuperAdmin) appRole = "super_admin";
    else if (isOrgAdmin) appRole = "org_admin";
    else if (outletRoles.some((r: { role: Role }) => r.role === "outlet_admin")) appRole = "outlet_admin";
    else if (outletRoles.some((r: { role: Role }) => r.role === "manager")) appRole = "manager";

    return {
        userId: user.id,
        isSuperAdmin,
        outletRoles,
        user: {
            id: user.id,
            email,
            full_name: fullName,
            avatar_url: avatarUrl,
            app_role: appRole,
        },
    };
}
