"use client";

import { useContext } from "react";
import type { UserContext } from "@eop/access";
import { UserCtx } from "@/components/providers/user-context-provider";

/**
 * Client hook to access the current user's context.
 * Web-specific — does NOT import from @eop/core.
 *
 * Must be used within <UserContextProvider>.
 */
export function useUserContext(): UserContext {
    const ctx = useContext(UserCtx);
    if (!ctx) {
        throw new Error(
            "useUserContext must be used within <UserContextProvider>. " +
            "Ensure the dashboard layout wraps children with the provider.",
        );
    }
    return ctx;
}
