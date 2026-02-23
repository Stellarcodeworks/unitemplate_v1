"use client";

import { createContext } from "react";
import type { UserContext } from "@eop/access";

/**
 * React context for the server-resolved UserContext.
 * Receives its value from the RSC dashboard layout via props.
 * Web-specific — does NOT import from @eop/core.
 */
export const UserCtx = createContext<UserContext | null>(null);

/**
 * Provider that wraps dashboard client components with UserContext.
 * The value is resolved server-side in the dashboard layout and passed as a prop.
 */
export function UserContextProvider({
    value,
    children,
}: {
    value: UserContext;
    children: React.ReactNode;
}) {
    return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>;
}
