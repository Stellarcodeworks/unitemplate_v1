import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/lib/auth/resolve-user-context";
import { ROUTES } from "@/lib/constants";
import { MyActivityLog } from "@/components/audit/my-activity-log";

/**
 * Audit page — Pattern B (Query-first).
 * RSC = auth check + RBAC context.
 * RLS enforces data visibility.
 * Page title: "Activity Log"
 */
export default async function AuditPage() {
    const supabase = await createSupabaseServerClient();
    const ctx = await resolveUserContext(supabase);

    const isOrgAdmin = ctx.outletRoles.some(
        (or) => or.role === "org_admin" || or.role === "super_admin"
    ) || ctx.isSuperAdmin;

    return <MyActivityLog isOrgAdmin={isOrgAdmin} userId={ctx.userId} />;
}
