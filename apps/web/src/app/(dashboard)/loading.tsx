/**
 * Dashboard loading skeleton — shared across all dashboard routes.
 * Shows a page-level skeleton with header + content area placeholders.
 */
export default function DashboardLoading() {
    return (
        <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-6 w-32 rounded bg-zinc-800" />
                    <div className="h-4 w-56 rounded bg-zinc-800/60" />
                </div>
                <div className="h-9 w-28 rounded-md bg-zinc-800" />
            </div>

            {/* Content skeleton — table-like rows */}
            <div className="rounded-lg border border-zinc-800">
                {/* Table header */}
                <div className="flex gap-4 border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
                    <div className="h-4 w-24 rounded bg-zinc-800/60" />
                    <div className="h-4 w-20 rounded bg-zinc-800/60" />
                    <div className="hidden h-4 w-32 rounded bg-zinc-800/60 md:block" />
                    <div className="h-4 w-16 rounded bg-zinc-800/60" />
                </div>
                {/* Rows */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 border-b border-zinc-800/50 px-4 py-3"
                    >
                        <div className="h-4 w-28 rounded bg-zinc-800/40" />
                        <div className="h-4 w-20 rounded bg-zinc-800/40" />
                        <div className="hidden h-4 w-36 rounded bg-zinc-800/40 md:block" />
                        <div className="h-4 w-14 rounded bg-zinc-800/40" />
                    </div>
                ))}
            </div>
        </div>
    );
}
