"use client";

import { useQuery } from "@tanstack/react-query";
import type { UserContext } from "@eop/access";
import { useSupabase } from "@/hooks/use-supabase";
import { useOutletContext } from "@/hooks/use-outlet-context";
import { UserList, type MemberRow } from "@/components/users/user-list";
import { Info } from "lucide-react";

/**
 * User management — Pattern B client component.
 * All data fetching via TanStack Query.
 * In "All Outlets" mode shows controlled empty state.
 *
 * Note: useQuery is always called (Rules of Hooks), but `enabled`
 * prevents execution when in All Outlets mode.
 */
export function UserManagement({
    userContext,
}: {
    userContext: UserContext;
}) {
    const supabase = useSupabase();
    const { selectedOutletId, isAllOutlets, mutationsDisabled } =
        useOutletContext();

    const {
        data: members,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["outlet-users", selectedOutletId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("outlet_users")
                .select(
                    `
          id,
          role,
          created_at,
          user_id,
          outlet_id,
          profiles(full_name, email, avatar_url)
        `,
                )
                .eq("outlet_id", selectedOutletId)
                .order("created_at", { ascending: false });

            if (error) throw new Error(error.message);
            return data as MemberRow[];
        },
        enabled: !isAllOutlets && !!selectedOutletId,
    });

    // All Outlets mode → controlled empty state
    if (isAllOutlets) {
        return (
            <div>
                <h1 className="text-xl font-semibold text-zinc-50">Users</h1>
                <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-16">
                    <Info className="mb-3 h-8 w-8 text-zinc-600" />
                    <p className="text-sm text-zinc-400">
                        Select a specific outlet to manage users
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div>
                <h1 className="text-xl font-semibold text-zinc-50">Users</h1>
                <div className="mt-8 flex items-center justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h1 className="text-xl font-semibold text-zinc-50">Users</h1>
                <div className="mt-8 rounded-lg border border-red-900/50 bg-red-950/50 px-6 py-8 text-center text-sm text-red-400">
                    Failed to load users: {(error as Error).message}
                </div>
            </div>
        );
    }

    return (
        <UserList
            members={members ?? []}
            userContext={userContext}
            outletId={selectedOutletId}
            mutationsDisabled={mutationsDisabled}
        />
    );
}
