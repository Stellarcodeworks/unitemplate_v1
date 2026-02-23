"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Dashboard-level error boundary.
 * Catches runtime errors in dashboard route segments and displays
 * a user-friendly error message with a retry button.
 */
export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to error reporting service (e.g., Sentry) in production
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 ring-1 ring-red-900/50">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-50">
                    Something went wrong
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                    An unexpected error occurred while loading this page.
                    Please try again or contact support if the problem persists.
                </p>
                {error.digest && (
                    <p className="mt-2 font-mono text-xs text-zinc-600">
                        Error ID: {error.digest}
                    </p>
                )}
                <button
                    onClick={reset}
                    className="mt-6 inline-flex items-center gap-2 rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
                >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                </button>
            </div>
        </div>
    );
}
