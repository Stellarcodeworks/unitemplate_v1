import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/lib/auth/resolve-user-context";
import { ROUTES } from "@/lib/constants";
import { OrgList } from "@/components/organizations/org-list";
import type { Database } from "@eop/db";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

/**
 * Organizations Management Page.
 * Gated to Super Admins only.
 */
export default async function OrganizationsPage() {
    const supabase = await createSupabaseServerClient();
    const ctx = await resolveUserContext(supabase);

    if (!ctx.isSuperAdmin) {
        redirect(ROUTES.HOME);
    }

    const { data: organizations } = await supabase
        .from("organizations")
        .select("*")
        .order("name");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-zinc-50">Organizations</h1>
                <p className="mt-1 text-zinc-400">
                    Manage all organizations in the platform.
                </p>
            </div>

            <OrgList organizations={(organizations || []) as Organization[]} />
        </div>
    );
}
