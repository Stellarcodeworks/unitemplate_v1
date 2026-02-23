"use client";

/**
 * Global error boundary.
 * Catches unhandled rendering errors across the app.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <div className="text-center">
                <h1 className="text-2xl font-semibold text-zinc-50">
                    Something went wrong
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                    {error.message || "An unexpected error occurred."}
                </p>
                <button
                    onClick={reset}
                    className="mt-6 rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
