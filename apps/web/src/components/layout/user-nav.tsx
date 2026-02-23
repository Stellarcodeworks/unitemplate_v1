"use client";

import { useRouter } from "next/navigation";
import { useSupabase } from "@/hooks/use-supabase";
import { LogOut } from "lucide-react";
import { ROUTES } from "@/lib/constants";

/**
 * User navigation — avatar area + sign out button.
 */
export function UserNav({ email }: { email: string }) {
    const router = useRouter();
    const supabase = useSupabase();

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.push(ROUTES.LOGIN);
        router.refresh();
    }

    // Extract initials from email
    const initials = email
        .split("@")[0]
        ?.slice(0, 2)
        .toUpperCase() ?? "?";

    return (
        <div className="border-t border-zinc-800 px-3 py-3">
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300">
                    {initials}
                </div>

                {/* Email */}
                <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm text-zinc-300">{email}</p>
                </div>

                {/* Sign Out */}
                <button
                    onClick={handleSignOut}
                    title="Sign out"
                    className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
