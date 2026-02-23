"use client";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import type { UserContext, Role } from "@eop/access";
import { getHighestRole } from "@eop/access";
import { useSupabase } from "@/hooks/use-supabase";
import { AssignRoleDialog } from "@/components/users/assign-role-dialog";
import { RoleSelect } from "@/components/users/role-select";
import { toast } from "sonner";

import { ROLE_LABELS } from "@/lib/constants";
import {
    Plus,
    Users,
    Trash2,
    Loader2,
} from "lucide-react";

/**
 * Shape of a member row from the outlet_users query.
 */
import type { Tables } from "@eop/db";

/**
 * Shape of a member row from the outlet_users query.
 */
export type MemberRow = Tables<"outlet_users"> & {
    profiles: Pick<Tables<"profiles">, "full_name" | "email" | "avatar_url"> | null;
};

/**
 * User list — data table with role change + remove actions.
 * Create button opens AssignRoleDialog.
 */
export function UserList({
    members,
    userContext,
    outletId,
    mutationsDisabled,
}: {
    members: MemberRow[];
    userContext: UserContext;
    outletId: string;
    mutationsDisabled: boolean;
}) {
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

    const supabase = useSupabase();
    const queryClient = useQueryClient();

    const myHighestRole = getHighestRole(userContext);

    async function handleRemoveUser(memberId: string) {
        if (mutationsDisabled) return;
        setRemovingId(memberId);

        try {
            const { error } = await supabase
                .from("outlet_users")
                .delete()
                .eq("id", memberId);

            if (error) {
                toast.error(`Failed to remove user: ${error.message}`);
                return;
            }

            toast.success("User removed from outlet.");
            queryClient.invalidateQueries({ queryKey: ["outlet-users", outletId] });
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setRemovingId(null);
        }
    }

    async function handleRoleChange(memberId: string, newRole: Role) {
        if (mutationsDisabled || changingRoleId) return;
        setChangingRoleId(memberId);

        try {
            const { error } = await supabase
                .from("outlet_users")
                .update({ role: newRole })
                .eq("id", memberId);

            if (error) {
                toast.error(`Failed to update role: ${error.message}`);
                return;
            }

            toast.success("Role updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["outlet-users", outletId] });
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setChangingRoleId(null);
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-50">Users</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Manage user roles for this outlet.
                    </p>
                </div>
                <button
                    onClick={() => setShowAssignDialog(true)}
                    disabled={mutationsDisabled}
                    title={
                        mutationsDisabled
                            ? "Select a specific outlet to perform this action"
                            : undefined
                    }
                    className="flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Add User
                </button>
            </div>

            {/* Table */}
            <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                            <th className="px-4 py-3 text-left font-medium text-zinc-400">
                                User
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-zinc-400">
                                Role
                            </th>
                            <th className="hidden px-4 py-3 text-left font-medium text-zinc-400 md:table-cell">
                                Added
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-4 py-12 text-center text-zinc-500"
                                >
                                    <Users className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
                                    <p>No users assigned to this outlet.</p>
                                    <p className="mt-1 text-xs">
                                        Add users to get started.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            members.map((member) => {
                                const initials =
                                    member.profiles?.full_name
                                        ?.split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase() ??
                                    member.profiles?.email?.slice(0, 2).toUpperCase() ??
                                    "?";

                                const isCurrentUser = member.user_id === userContext.userId;

                                return (
                                    <tr
                                        key={member.id}
                                        className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/30"
                                    >
                                        {/* User info */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-200">
                                                        {member.profiles?.full_name ?? "Unknown"}
                                                        {isCurrentUser && (
                                                            <span className="ml-1.5 text-xs text-zinc-500">
                                                                (you)
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">
                                                        {member.profiles?.email ?? "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="px-4 py-3">
                                            {mutationsDisabled || isCurrentUser ? (
                                                <span className="text-sm text-zinc-300">
                                                    {ROLE_LABELS[
                                                        member.role as keyof typeof ROLE_LABELS
                                                    ] ?? member.role}
                                                </span>
                                            ) : (
                                                <RoleSelect
                                                    currentRole={member.role as Role}
                                                    assignerRole={myHighestRole ?? "staff"}
                                                    disabled={changingRoleId === member.id}
                                                    onChange={(newRole) =>
                                                        handleRoleChange(member.id, newRole)
                                                    }
                                                />
                                            )}
                                        </td>

                                        {/* Added date */}
                                        <td className="hidden px-4 py-3 text-zinc-500 md:table-cell">
                                            {new Date(member.created_at).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3 text-right">
                                            {!isCurrentUser && !mutationsDisabled && (
                                                <button
                                                    onClick={() => handleRemoveUser(member.id)}
                                                    disabled={removingId === member.id}
                                                    title="Remove from outlet"
                                                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/50 disabled:opacity-50"
                                                >
                                                    {removingId === member.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Assign Role Dialog */}
            {showAssignDialog && (
                <AssignRoleDialog
                    outletId={outletId}
                    assignerRole={myHighestRole ?? "staff"}
                    onClose={() => setShowAssignDialog(false)}
                />
            )}
        </div>
    );
}
