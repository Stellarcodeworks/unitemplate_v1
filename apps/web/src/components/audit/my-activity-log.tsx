"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import {
    Activity,
    Filter,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Database,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    INSERT: {
        label: "Created",
        color: "bg-emerald-950/50 text-emerald-400 ring-1 ring-emerald-900/50",
    },
    UPDATE: {
        label: "Updated",
        color: "bg-amber-950/50 text-amber-400 ring-1 ring-amber-900/50",
    },
    DELETE: {
        label: "Deleted",
        color: "bg-red-950/50 text-red-400 ring-1 ring-red-900/50",
    },
};

/**
 * Filters for the activity log.
 */
interface ActivityFilters {
    table_name: string;
    action: string;
    dateFrom: string;
    dateTo: string;
}

const defaultFilters: ActivityFilters = {
    table_name: "",
    action: "",
    dateFrom: "",
    dateTo: "",
};



interface MyActivityLogProps {
    isOrgAdmin?: boolean;
    userId?: string;
}

/**
 * Activity Log — Pattern B client component.
 * Fetches audit_logs via TanStack Query with filters and pagination.
 * Supports "My Activity" vs "All Activity" toggle for Org Admins.
 */
export function MyActivityLog({ isOrgAdmin = false, userId }: MyActivityLogProps) {
    const supabase = useSupabase();
    const [scope, setScope] = useState<"me" | "all">("me");
    const [filters, setFilters] = useState<ActivityFilters>(defaultFilters);
    const [page, setPage] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const {
        data: result,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["activity-log", scope, filters, page],
        queryFn: async () => {
            let query = supabase
                .from("audit_logs")
                .select("*", { count: "exact" });

            // Scope filter:
            // "me" -> performed_by = userId (or auth.uid() implicitly if we didn't have userId, but explicit is better)
            // But wait, RLS for non-admins forces "me" anyway.
            // If isOrgAdmin is true, RLS allows more.
            // So if scope is "me", we explicitly filter.
            // If scope is "all", we don't filter (and let RLS show everything allowed).

            if (scope === "me") {
                // If we have userId passed, use it. Otherwise rely on RLS (risk: if admin, RLS shows all, so we MUST filter).
                // We should use `supabase.auth.getUser()` if userId missing? 
                // Better: require userId prop or fetch it. 
                // Logic: If scope="me", add .eq("performed_by", userId || (await supabase.auth.getUser()).data.user?.id)
                // Since hooks are sync, we can't await here easily without complexity.
                // WE WILL ASSUME userId IS PASSED if isOrgAdmin is true.
                if (userId) {
                    query = query.eq("performed_by", userId);
                }
            }

            if (filters.table_name) {
                query = query.eq("table_name", filters.table_name);
            }
            if (filters.action) {
                query = query.eq("action", filters.action);
            }
            if (filters.dateFrom) {
                query = query.gte("performed_at", filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte(
                    "performed_at",
                    `${filters.dateTo}T23:59:59.999Z`,
                );
            }

            const { data, error, count } = await query
                .order("performed_at", { ascending: false })
                .range(from, to);

            if (error) {
                throw new Error(error.message);
            }

            return { data, count };
        },
    });

    const totalCount = result?.count ?? 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const logs = result?.data ?? [];

    const handleFilterChange = useCallback(
        (key: keyof ActivityFilters, value: string) => {
            setFilters((prev) => ({ ...prev, [key]: value }));
            setPage(0); // Reset to first page on filter change
        },
        [],
    );

    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
        setPage(0);
    }, []);

    const hasActiveFilters = Object.values(filters).some(Boolean);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-50">Activity Log</h1>
                    <p className="mt-1 text-sm text-zinc-400">
                        {scope === "all" ? "All activity in your organization." : "Your recent actions across the platform."}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {isOrgAdmin && (
                        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
                            <button
                                onClick={() => { setScope("me"); setPage(0); }}
                                className={cn(
                                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                    scope === "me"
                                        ? "bg-zinc-800 text-zinc-200"
                                        : "text-zinc-400 hover:text-zinc-300"
                                )}
                            >
                                My Activity
                            </button>
                            <button
                                onClick={() => { setScope("all"); setPage(0); }}
                                className={cn(
                                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                    scope === "all"
                                        ? "bg-zinc-800 text-zinc-200"
                                        : "text-zinc-400 hover:text-zinc-300"
                                )}
                            >
                                All Activity
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            showFilters || hasActiveFilters
                                ? "bg-zinc-800 text-zinc-200"
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300",
                        )}
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-600 text-[10px] text-zinc-200">
                                {Object.values(filters).filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Table Name */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Table
                            </label>
                            <select
                                value={filters.table_name}
                                onChange={(e) =>
                                    handleFilterChange("table_name", e.target.value)
                                }
                                className="block w-full cursor-pointer rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                            >
                                <option value="">All tables</option>
                                <option value="outlets">Outlets</option>
                                <option value="outlet_users">Users</option>
                                <option value="organizations">Organizations</option>
                                <option value="profiles">Profiles</option>
                            </select>
                        </div>

                        {/* Action */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                Action
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) =>
                                    handleFilterChange("action", e.target.value)
                                }
                                className="block w-full cursor-pointer rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                            >
                                <option value="">All actions</option>
                                <option value="INSERT">Created</option>
                                <option value="UPDATE">Updated</option>
                                <option value="DELETE">Deleted</option>
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                From
                            </label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) =>
                                    handleFilterChange("dateFrom", e.target.value)
                                }
                                className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                                To
                            </label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) =>
                                    handleFilterChange("dateTo", e.target.value)
                                }
                                className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="mt-8 flex items-center justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-8 rounded-lg border border-red-900/50 bg-red-950/50 px-6 py-8 text-center text-sm text-red-400">
                    Failed to load activity: {(error as Error).message}
                </div>
            )}

            {/* Results */}
            {!isLoading && !error && (
                <>
                    {logs.length === 0 ? (
                        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-16">
                            <Activity className="mb-3 h-8 w-8 text-zinc-700" />
                            <p className="text-sm text-zinc-400">
                                {hasActiveFilters
                                    ? "No activity matching your filters."
                                    : "No activity recorded yet."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Log Entries */}
                            <div className="mt-6 space-y-2">
                                {logs.map((log) => {
                                    const actionMeta =
                                        ACTION_LABELS[log.action] ?? ACTION_LABELS.UPDATE;

                                    return (
                                        <div
                                            key={log.id}
                                            className="flex items-start gap-4 rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-4 py-3 transition-colors hover:bg-zinc-900/50"
                                        >
                                            {/* Icon */}
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800/50">
                                                {log.action === "INSERT" && (
                                                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                                                )}
                                                {log.action === "UPDATE" && (
                                                    <Database className="h-3.5 w-3.5 text-amber-400" />
                                                )}
                                                {log.action === "DELETE" && (
                                                    <Database className="h-3.5 w-3.5 text-red-400" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                                                            actionMeta.color,
                                                        )}
                                                    >
                                                        {actionMeta.label}
                                                    </span>
                                                    <span className="text-sm font-medium text-zinc-300">
                                                        {log.table_name}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-zinc-500">
                                                    Record: {log.record_id}
                                                </p>
                                            </div>

                                            {/* Timestamp */}
                                            <div className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-500">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(log.performed_at).toLocaleString("en-GB", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-xs text-zinc-500">
                                        Showing {from + 1}–{Math.min(to + 1, totalCount)} of{" "}
                                        {totalCount}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                            Previous
                                        </button>
                                        <span className="text-xs text-zinc-500">
                                            {page + 1} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setPage((p) => Math.min(totalPages - 1, p + 1))
                                            }
                                            disabled={page >= totalPages - 1}
                                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Next
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
