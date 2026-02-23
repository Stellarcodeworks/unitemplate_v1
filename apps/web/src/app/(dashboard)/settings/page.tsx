import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/lib/auth/resolve-user-context";
import { hasRole } from "@eop/access";
import { ROUTES } from "@/lib/constants";
import { Settings, Construction } from "lucide-react";

/**
 * Settings page — super_admin only.
 * Placeholder for Phase 5+ configuration features.
 */
export default async function SettingsPage() {
    const supabase = await createSupabaseServerClient();
    const ctx = await resolveUserContext(supabase);

    // Role gate: super_admin only
    if (!hasRole(ctx, "super_admin")) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    return (
        <div>
            <h1 className="text-xl font-semibold text-zinc-50">Settings</h1>
            <p className="mt-1 text-sm text-zinc-400">
                System-wide configuration and platform settings.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-16">
                <div className="mb-4 flex items-center gap-3">
                    <Settings className="h-8 w-8 text-zinc-700" />
                    <Construction className="h-6 w-6 text-amber-500/50" />
                </div>
                <p className="text-sm font-medium text-zinc-300">
                    Settings coming soon
                </p>
                <p className="mt-1 max-w-sm text-center text-xs text-zinc-500">
                    Platform-wide configuration, organization management, and system
                    preferences will be available here in a future release.
                </p>
            </div>
        </div>
    );
}
