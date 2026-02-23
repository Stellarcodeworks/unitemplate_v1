import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/lib/auth/resolve-user-context";
import { hasRole } from "@eop/access";
import { ROUTES } from "@/lib/constants";
import { UserManagement } from "@/components/users/user-management";

/**
 * Users page — Pattern B (Query-first).
 * RSC = auth + role check ONLY. No data fetching.
 * Client component handles all data fetching via TanStack Query.
 * Minimum role: manager.
 */
export default async function UsersPage() {
    const supabase = await createSupabaseServerClient();
    const ctx = await resolveUserContext(supabase);

    // Role gate: manager+ required
    if (!hasRole(ctx, "manager")) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    return <UserManagement userContext={ctx} />;
}
