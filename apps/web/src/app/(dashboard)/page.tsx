import Link from "next/link";
import { ArrowRight, Building2, Shield, Activity, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/lib/auth/resolve-user-context";
import type { Database } from "@eop/db";

type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

/**
 * Dashboard Home Page (/)
 * Displays high-level overview and quick links.
 */
export default async function DashboardHomePage() {
    const supabase = await createSupabaseServerClient();
    const ctx = await resolveUserContext(supabase);

    // Quick stats
    const outletCount = ctx.outletRoles.length;
    const isSuperAdmin = ctx.user.app_role === "super_admin";
    const isOrgAdmin = ctx.outletRoles.some((or) => or.role === "org_admin");

    // Fetch recent activity (last 5)
    // RLS limits this to "My Activity" for now (until Phase 5D)
    const { data: recentActivityData } = await supabase
        .from("audit_logs")
        .select("*")
        .order("performed_at", { ascending: false })
        .limit(5);

    const recentActivity = (recentActivityData || []) as AuditLog[];

    return (
        <div className="space-y-8">
            {/* Welcome & Header */}
            <div>
                <h1 className="text-2xl font-semibold text-zinc-50">
                    Welcome back, {ctx.user.full_name.split(" ")[0]}
                </h1>
                <p className="mt-1 text-zinc-400">
                    Here's what's happening in your implementation today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Outlets */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-950/50 text-blue-400">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">Outlets</p>
                            <h3 className="text-2xl font-bold text-zinc-50">{outletCount}</h3>
                        </div>
                    </div>
                </div>

                {/* Global Role */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-950/50 text-purple-400">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400">Access Level</p>
                            <h3 className="text-xl font-bold text-zinc-50 capitalize">
                                {ctx.user.app_role.replace("_", " ")}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Organization (First one) */}
                {ctx.outletRoles[0]?.org_name && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 sm:col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950/50 text-emerald-400">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-400">Organization</p>
                                <h3 className="text-xl font-bold text-zinc-50">
                                    {ctx.outletRoles[0].org_name}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Activity & Shortcuts */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Recent Activity */}
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-zinc-500" />
                            <h3 className="font-medium text-zinc-200">Recent Activity</h3>
                        </div>
                        <Link
                            href="/audit"
                            className="text-xs text-zinc-500 hover:text-zinc-300"
                        >
                            View all
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-800/50">
                        {!recentActivity?.length ? (
                            <div className="p-6 text-center text-sm text-zinc-500">
                                No recent activity found.
                            </div>
                        ) : (
                            recentActivity.map((log) => (
                                <div key={log.id} className="flex items-center gap-3 px-6 py-3">
                                    <div
                                        className={`h-2 w-2 rounded-full ${log.action === "INSERT"
                                            ? "bg-emerald-500"
                                            : log.action === "DELETE"
                                                ? "bg-red-500"
                                                : "bg-amber-500"
                                            }`}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-zinc-300">
                                            <span className="font-medium text-zinc-200">
                                                {log.action}
                                            </span>{" "}
                                            {log.table_name}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {new Date(log.performed_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-zinc-400">Quick Actions</h3>

                    {(isOrgAdmin || isSuperAdmin) && (
                        <Link
                            href="/outlets"
                            className="group flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800 text-zinc-400 transition-colors group-hover:bg-zinc-700 group-hover:text-zinc-200">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-50">
                                    Manage Outlets
                                </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
                        </Link>
                    )}

                    <Link
                        href="/users"
                        className="group flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800 text-zinc-400 transition-colors group-hover:bg-zinc-700 group-hover:text-zinc-200">
                                <Users className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-50">
                                Manage Users
                            </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
                    </Link>

                    <Link
                        href="/audit"
                        className="group flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800 text-zinc-400 transition-colors group-hover:bg-zinc-700 group-hover:text-zinc-200">
                                <Activity className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-50">
                                View Activity
                            </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
