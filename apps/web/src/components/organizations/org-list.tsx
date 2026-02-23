"use client";

import { useState } from "react";
import { Plus, Building2, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/hooks/use-supabase";

interface Organization {
    id: string;
    name: string;
    created_at: string;
    // Count of outlets? derived in SQL or separate query?
}

interface OrgListProps {
    organizations: Organization[];
}

export function OrgList({ organizations }: OrgListProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-zinc-200">All Organizations</h2>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                    <Plus className="h-4 w-4" />
                    Create Organization
                </button>
            </div>

            {/* List */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {organizations.map((org) => (
                    <div
                        key={org.id}
                        className="group flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-zinc-800 group-hover:text-zinc-200">
                                <Building2 className="h-5 w-5" />
                            </div>
                            {/* Menu / Actions could go here */}
                        </div>

                        <div className="mt-4">
                            <h3 className="text-base font-semibold text-zinc-50">
                                {org.name}
                            </h3>
                            <p className="text-xs text-zinc-500 font-mono mt-1">
                                {org.id.slice(0, 8)}...
                            </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-zinc-800/50 pt-4 text-xs text-zinc-500">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{new Date(org.created_at).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                })}</span>
                            </div>
                            {/* Placeholder for outlet count if available */}
                        </div>
                    </div>
                ))}

                {organizations.length === 0 && (
                    <div className="col-span-full py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-500">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-sm font-medium text-zinc-200">
                            No organizations found
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                            Get started by creating a new organization.
                        </p>
                    </div>
                )}
            </div>

            {/* Create Dialog (to be implemented more fully or inline) */}
            {isCreateOpen && (
                <CreateOrgDialog
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                />
            )}
        </div>
    );
}

function CreateOrgDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const supabase = useSupabase();
    const router = useRouter();

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke("admin-create-organization", {
                body: { name },
            });

            if (error) throw new Error(error.message);

            toast.success("Organization created successfully");
            router.refresh();
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create organization");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-zinc-50">Create Organization</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                        This will create a new organization and a default Headquarters outlet.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                            Organization Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="block w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                        >
                            {isLoading && (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                            )}
                            Create Organization
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
