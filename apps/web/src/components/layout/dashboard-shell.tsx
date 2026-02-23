"use client";

import { Suspense } from "react";
import type { UserContext } from "@eop/access";
import { UserContextProvider } from "@/components/providers/user-context-provider";
import { OutletContextProvider } from "@/components/providers/outlet-context-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { OutletSwitcher } from "@/components/layout/outlet-switcher";
import { UserNav } from "@/components/layout/user-nav";
import { useOutletContext } from "@/hooks/use-outlet-context";
import { AlertCircle } from "lucide-react";

/**
 * Dashboard shell — client component that wraps all dashboard pages.
 * Receives server-resolved UserContext as a prop.
 * Wraps children with UserContextProvider and OutletContextProvider.
 */
export function DashboardShell({
    userContext,
    userEmail,
    children,
}: {
    userContext: UserContext;
    userEmail: string;
    children: React.ReactNode;
}) {
    return (
        <UserContextProvider value={userContext}>
            <Suspense fallback={null}>
                <OutletContextProvider userContext={userContext}>
                    <div className="flex min-h-screen">
                        {/* Sidebar */}
                        <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 md:flex">
                            {/* Logo / Brand */}
                            <div className="flex h-14 items-center border-b border-zinc-800 px-4">
                                <span className="text-sm font-semibold tracking-tight text-zinc-50">
                                    EOP Admin
                                </span>
                            </div>

                            {/* Outlet Switcher */}
                            <OutletSwitcher />

                            {/* Navigation */}
                            <AppSidebar userContext={userContext} />

                            {/* User Nav — pinned to bottom */}
                            <UserNav email={userEmail} />
                        </aside>

                        {/* Main content area */}
                        <main className="flex-1">
                            {/* Top bar */}
                            <header className="flex h-14 items-center justify-between border-b border-zinc-800 px-6">
                                <MutationWarningBanner />
                                <div />
                            </header>

                            {/* Page content */}
                            <div className="p-6">{children}</div>
                        </main>
                    </div>
                </OutletContextProvider>
            </Suspense>
        </UserContextProvider>
    );
}

/**
 * Shows a warning banner when mutations are disabled (All Outlets mode).
 */
function MutationWarningBanner() {
    const { mutationsDisabled, mutationsDisabledReason } = useOutletContext();

    if (!mutationsDisabled || !mutationsDisabledReason) return null;

    return (
        <div className="flex items-center gap-2 rounded-md bg-amber-950/50 border border-amber-900/50 px-3 py-1.5 text-xs text-amber-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{mutationsDisabledReason}</span>
        </div>
    );
}
