"use client";

import { useState } from "react";

import { useOutletContext } from "@/hooks/use-outlet-context";
import { CreateOutletDialog } from "@/components/outlets/create-outlet-dialog";
import { Plus, Building2, MapPin, Calendar, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Shape of an outlet row with joined organization.
 */
import type { Tables } from "@eop/db";

/**
 * Shape of an outlet row with joined organization.
 */
type OutletRow = Tables<"outlets"> & {
    organizations: Pick<Tables<"organizations">, "name"> | null;
};

/**
 * Outlet list — client component receiving RSC-fetched data.
 * Renders a table of outlets with create button.
 */
export function OutletList({
    outlets,
}: {
    outlets: OutletRow[];
}) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const { mutationsDisabled, mutationsDisabledReason } = useOutletContext();
    const searchParams = useSearchParams();
    const outletParam = searchParams.get("outlet");

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-50">Outlets</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        Manage your organization&apos;s outlets and locations.
                    </p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowCreateDialog(true)}
                        disabled={mutationsDisabled}
                        title={mutationsDisabledReason ?? undefined}
                        className="flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        Create Outlet
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="mt-6 overflow-hidden rounded-lg border border-zinc-800">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                            <th className="px-4 py-3 text-left font-medium text-zinc-400">
                                Name
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-zinc-400">
                                Organization
                            </th>
                            <th className="hidden px-4 py-3 text-left font-medium text-zinc-400 md:table-cell">
                                Address
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-zinc-400">
                                Status
                            </th>
                            <th className="hidden px-4 py-3 text-left font-medium text-zinc-400 md:table-cell">
                                Created
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {outlets.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                                    <Building2 className="mx-auto mb-3 h-8 w-8 text-zinc-700" />
                                    <p>No outlets found.</p>
                                    <p className="mt-1 text-xs">
                                        Create your first outlet to get started.
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            outlets.map((outlet) => (
                                <tr
                                    key={outlet.id}
                                    className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/30"
                                >
                                    {/* Name */}
                                    <td className="px-4 py-3 font-medium text-zinc-200">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 shrink-0 text-zinc-600" />
                                            {outlet.name}
                                        </div>
                                    </td>

                                    {/* Organization */}
                                    <td className="px-4 py-3 text-zinc-400">
                                        {outlet.organizations?.name ?? "—"}
                                    </td>

                                    {/* Address */}
                                    <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                                        {outlet.address ? (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                                                <span className="max-w-[200px] truncate">
                                                    {outlet.address}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-600">—</span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        <span
                                            className={cn(
                                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                                outlet.is_active
                                                    ? "bg-emerald-950/50 text-emerald-400 ring-1 ring-emerald-900/50"
                                                    : "bg-zinc-800 text-zinc-500 ring-1 ring-zinc-700",
                                            )}
                                        >
                                            {outlet.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>

                                    {/* Created Date */}
                                    <td className="hidden px-4 py-3 text-zinc-500 md:table-cell">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                                            {new Date(outlet.created_at).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/outlets/${outlet.id}${outletParam ? `?outlet=${outletParam}` : ""}`}
                                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Dialog */}
            {showCreateDialog && (
                <CreateOutletDialog onClose={() => setShowCreateDialog(false)} />
            )}
        </div>
    );
}
