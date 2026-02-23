"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/hooks/use-supabase";
import { useOutletContext } from "@/hooks/use-outlet-context";
import { toast } from "sonner";
import {
    ArrowLeft,
    Building2,
    MapPin,
    Save,
    Users,
    Loader2,
    Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/constants";

/**
 * Shape of outlet with joined organization.
 */
import type { Tables } from "@eop/db";

/**
 * Shape of outlet with joined organization.
 */
type OutletData = Tables<"outlets"> & {
    organizations: Pick<Tables<"organizations">, "name"> | null;
};

/**
 * Shape of outlet member with joined profile.
 */
type MemberRow = Tables<"outlet_users"> & {
    profiles: Pick<Tables<"profiles">, "full_name" | "email"> | null;
};

/**
 * Outlet detail card — editable name and address fields.
 * Save button disabled in "All Outlets" mode.
 * Direct Supabase update (RLS enforced), then router.refresh().
 */
export function OutletDetailCard({
    outlet,
    members,
}: {
    outlet: OutletData;
    members: MemberRow[];
}) {
    const router = useRouter();
    const supabase = useSupabase();
    const { mutationsDisabled, mutationsDisabledReason } = useOutletContext();

    const [name, setName] = useState(outlet.name);
    const [address, setAddress] = useState(outlet.address ?? "");
    const [saving, setSaving] = useState(false);

    const hasChanges = name !== outlet.name || address !== (outlet.address ?? "");

    async function handleSave() {
        if (!hasChanges || mutationsDisabled) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("outlets")
                .update({
                    name: name.trim(),
                    address: address.trim() || null,
                })
                .eq("id", outlet.id);

            if (error) {
                toast.error(`Failed to update outlet: ${error.message}`);
                return;
            }

            toast.success("Outlet updated successfully.");
            router.refresh();
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Back navigation */}
            <Link
                href="/outlets"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Outlets
            </Link>

            {/* Outlet Info Card */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
                <div className="border-b border-zinc-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-zinc-500" />
                            <div>
                                <h1 className="text-lg font-semibold text-zinc-50">
                                    {outlet.name}
                                </h1>
                                <p className="text-sm text-zinc-500">
                                    {outlet.organizations?.name ?? "Unknown Organization"}
                                </p>
                            </div>
                        </div>
                        <span
                            className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                outlet.is_active
                                    ? "bg-emerald-950/50 text-emerald-400 ring-1 ring-emerald-900/50"
                                    : "bg-zinc-800 text-zinc-500 ring-1 ring-zinc-700",
                            )}
                        >
                            {outlet.is_active ? "Active" : "Inactive"}
                        </span>
                    </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-4 p-6">
                    {/* Name */}
                    <div>
                        <label
                            htmlFor="edit-name"
                            className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                            Outlet Name
                        </label>
                        <input
                            id="edit-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={mutationsDisabled}
                            className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label
                            htmlFor="edit-address"
                            className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                            Address
                        </label>
                        <div className="relative">
                            <input
                                id="edit-address"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={mutationsDisabled}
                                placeholder="Enter address (optional)"
                                className="block w-full rounded-md border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        {mutationsDisabled && mutationsDisabledReason && (
                            <span className="text-xs text-amber-400">
                                {mutationsDisabledReason}
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving || mutationsDisabled}
                            title={mutationsDisabledReason ?? undefined}
                            className="flex items-center gap-2 rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="h-3.5 w-3.5" />
                            )}
                            {saving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Members Table */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
                <div className="border-b border-zinc-800 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-zinc-500" />
                        <h2 className="text-sm font-semibold text-zinc-200">
                            Members ({members.length})
                        </h2>
                    </div>
                </div>

                <div className="divide-y divide-zinc-800/50">
                    {members.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-zinc-500">
                            No members assigned to this outlet.
                        </div>
                    ) : (
                        members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between px-6 py-3"
                            >
                                <div>
                                    <p className="text-sm font-medium text-zinc-200">
                                        {member.profiles?.full_name ?? "Unknown User"}
                                    </p>
                                    <p className="text-xs text-zinc-500">
                                        {member.profiles?.email ?? "—"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Shield className="h-3.5 w-3.5 text-zinc-600" />
                                    <span className="text-xs font-medium text-zinc-400">
                                        {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] ??
                                            member.role}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
