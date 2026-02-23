"use client";

import { useContext } from "react";
import {
    OutletCtx,
    type OutletContextValue,
} from "@/components/providers/outlet-context-provider";

/**
 * Client hook to access the current outlet selection state.
 * Must be used within <OutletContextProvider>.
 */
export function useOutletContext(): OutletContextValue {
    const ctx = useContext(OutletCtx);
    if (!ctx) {
        throw new Error(
            "useOutletContext must be used within <OutletContextProvider>. " +
            "Ensure the dashboard layout wraps children with the provider.",
        );
    }
    return ctx;
}
