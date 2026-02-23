"use client";

import { useUserContext } from "@/hooks/use-user-context";
import { useOutletContext } from "@/hooks/use-outlet-context";
import { hasRole } from "@eop/access";
import { Building2, ChevronDown, Globe } from "lucide-react";

/**
 * Outlet switcher dropdown in the sidebar.
 * Shows all outlets the user has access to.
 * "All Outlets" option only for org_admin+.
 */
export function OutletSwitcher() {
    const ctx = useUserContext();
    const { selectedOutletId, switchOutlet } = useOutletContext();
    const canSeeAll = hasRole(ctx, "org_admin");

    return (
        <div className="px-3 py-2">
            <label
                htmlFor="outlet-select"
                className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500"
            >
                Outlet
            </label>
            <div className="relative">
                <select
                    id="outlet-select"
                    value={selectedOutletId}
                    onChange={(e) => switchOutlet(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-md border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-8 text-sm text-zinc-200 transition-colors hover:border-zinc-700 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                >
                    {canSeeAll && (
                        <option value="all">All Outlets</option>
                    )}
                    {ctx.outletRoles.map((r) => (
                        <option key={r.outletId} value={r.outletId}>
                            {r.outletId.slice(0, 8)}… ({r.role})
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
                    {selectedOutletId === "all" ? (
                        <Globe className="h-3.5 w-3.5" />
                    ) : (
                        <Building2 className="h-3.5 w-3.5" />
                    )}
                </div>
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500">
                    <ChevronDown className="h-3.5 w-3.5" />
                </div>
            </div>
        </div>
    );
}
