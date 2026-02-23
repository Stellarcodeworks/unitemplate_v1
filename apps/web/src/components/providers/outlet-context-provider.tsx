"use client";

import { createContext, useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { canAccessOutlet, hasRole } from "@eop/access";
import type { UserContext } from "@eop/access";

/**
 * Outlet context value exposed to consumers.
 */
export interface OutletContextValue {
    /** Currently selected outlet ID, or "all" for All Outlets mode */
    selectedOutletId: string | "all";
    /** Whether "All Outlets" mode is active */
    isAllOutlets: boolean;
    /** Whether mutations should be disabled (true in "All Outlets" mode) */
    mutationsDisabled: boolean;
    /** Tooltip message when mutations are disabled */
    mutationsDisabledReason: string | null;
    /** Switch to a different outlet */
    switchOutlet: (outletId: string | "all") => void;
}

export const OutletCtx = createContext<OutletContextValue | null>(null);

/**
 * Provider that manages outlet selection state via URL search params.
 *
 * Rules:
 * - Source of truth: ?outlet=<uuid> or ?outlet=all
 * - "All Outlets" only available for org_admin+
 * - Mutations disabled in "All" mode
 * - Falls back to first outlet if param is missing or invalid
 */
export function OutletContextProvider({
    userContext,
    children,
}: {
    userContext: UserContext;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const outletParam = searchParams.get("outlet");
    const canSeeAll = hasRole(userContext, "org_admin");

    // Resolve the effective outlet selection
    const selectedOutletId = useMemo(() => {
        // "all" is valid only for org_admin+
        if (outletParam === "all" && canSeeAll) {
            return "all" as const;
        }

        // Validate the outlet param against user's access
        if (outletParam && canAccessOutlet(userContext, outletParam)) {
            return outletParam;
        }

        // Fallback: first outlet in the user's roles
        if (userContext.outletRoles.length > 0) {
            return userContext.outletRoles[0]!.outletId;
        }

        // Edge case: user has no outlet roles (super_admin with no assignments)
        // Default to "all" if they can see all, otherwise empty string
        return canSeeAll ? ("all" as const) : "";
    }, [outletParam, canSeeAll, userContext]);

    const isAllOutlets = selectedOutletId === "all";

    const mutationsDisabled = isAllOutlets;
    const mutationsDisabledReason = isAllOutlets
        ? "Select a specific outlet to perform this action"
        : null;

    const switchOutlet = useCallback(
        (outletId: string | "all") => {
            const params = new URLSearchParams(searchParams.toString());
            if (outletId === "all") {
                params.set("outlet", "all");
            } else {
                params.set("outlet", outletId);
            }
            router.push(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams],
    );

    const value = useMemo<OutletContextValue>(
        () => ({
            selectedOutletId,
            isAllOutlets,
            mutationsDisabled,
            mutationsDisabledReason,
            switchOutlet,
        }),
        [
            selectedOutletId,
            isAllOutlets,
            mutationsDisabled,
            mutationsDisabledReason,
            switchOutlet,
        ],
    );

    return <OutletCtx.Provider value={value}>{children}</OutletCtx.Provider>;
}
