/**
 * Mobile-specific utility to resolve a user's context from Supabase.
 *
 * ⚠️ Returns the multi-outlet `MobileUserContext` shape:
 * {
 *   userId: string;
 *   isSuperAdmin: boolean;
 *   outletRoles: { outletId: string; role: Role; outlet_name: string; org_name: string }[];
 *   user: UserProfile;
 * }
 */
import { supabase } from "./supabase";
import type { UserContext, Role } from "@eop/access";

export async function resolveUserContext(userId: string): Promise<UserContext> {
    // 1. Fetch user profile (only full_name, avatar_url, email)
    const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .eq("id", userId)
        .single();

    if (profileErr || !profileData) {
        throw new Error(`Failed to load user profile: ${profileErr?.message ?? "Unknown error"}`);
    }

    const profile = profileData as {
        id: string;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
    };

    // 2. Fetch outlet roles with joined references
    const { data: roles, error: rolesErr } = await supabase
        .from("outlet_users")
        .select(`
            outlet_id,
            role,
            outlets (
               name,
               organizations (name)
            )
        `)
        .eq("user_id", userId);

    if (rolesErr) {
        throw new Error(`Failed to load outlet roles: ${rolesErr.message}`);
    }

    // 3. Map to context shape
    const outletRoles = (roles || []).map((r: any) => ({
        outletId: r.outlet_id,
        role: r.role as Role,
        outlet_name: r.outlets?.name,
        org_name: r.outlets?.organizations?.name,
    }));

    const isSuperAdmin = outletRoles.some((r) => r.role === "super_admin");
    const isOrgAdmin = outletRoles.some((r) => r.role === "org_admin");

    // Derive top-level app role for UI display
    let appRole = "staff";
    if (isSuperAdmin) appRole = "super_admin";
    else if (isOrgAdmin) appRole = "org_admin";
    else if (outletRoles.some((r) => r.role === "outlet_admin")) appRole = "outlet_admin";
    else if (outletRoles.some((r) => r.role === "manager")) appRole = "manager";

    return {
        userId,
        isSuperAdmin,
        outletRoles,
        user: {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name || "",
            avatar_url: profile.avatar_url,
            app_role: appRole as any,
        },
    };
}
