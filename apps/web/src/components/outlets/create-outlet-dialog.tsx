"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useSupabase } from "@/hooks/use-supabase";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";

/**
 * Zod schema for create-outlet form validation.
 * Matches the Edge Function expected payload: { name, organization_id, address }.
 */
const createOutletSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    organization_id: z.string().uuid("Valid organization ID is required"),
    address: z.string().max(500).optional(),
});

/**
 * Dialog for creating a new outlet.
 * Calls the admin-create-outlet Edge Function.
 * No optimistic updates — waits for confirmation then calls router.refresh().
 */
export function CreateOutletDialog({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const supabase = useSupabase();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        const formData = new FormData(e.currentTarget);
        const rawData = {
            name: formData.get("name") as string,
            organization_id: formData.get("organization_id") as string,
            address: (formData.get("address") as string) || undefined,
        };

        // Zod validation
        const result = createOutletSchema.safeParse(rawData);
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0];
                if (field) errors[String(field)] = issue.message;
            });
            setFieldErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const { data, error: fnError } = await supabase.functions.invoke(
                "admin-create-outlet",
                { body: result.data },
            );

            if (fnError) {
                // Structured status check — avoid fragile string matching
                const status =
                    (fnError as Record<string, unknown>).context &&
                        typeof (fnError as Record<string, unknown>).context === "object"
                        ? ((fnError as Record<string, unknown>).context as Record<string, unknown>)
                            .status
                        : undefined;

                if (status === 403) {
                    toast.error("Insufficient permissions to create outlet.");
                } else {
                    setError(fnError.message || "Failed to create outlet.");
                }
                return;
            }

            // Check for error in response body (Edge Function returns JSON errors with status)
            if (data?.error) {
                if (data.status === 403) {
                    toast.error("Insufficient permissions to create outlet.");
                } else {
                    setError(data.error);
                }
                return;
            }

            toast.success("Outlet created successfully.");
            onClose();
            router.refresh();
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-zinc-50">
                        Create Outlet
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Name */}
                    <div>
                        <label
                            htmlFor="outlet-name"
                            className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                            Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="outlet-name"
                            name="name"
                            type="text"
                            required
                            placeholder="e.g. Downtown Branch"
                            className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                        />
                        {fieldErrors.name && (
                            <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
                        )}
                    </div>

                    {/* Organization ID */}
                    <div>
                        <label
                            htmlFor="outlet-org"
                            className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                            Organization ID <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="outlet-org"
                            name="organization_id"
                            type="text"
                            required
                            placeholder="UUID"
                            className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                        />
                        {fieldErrors.organization_id && (
                            <p className="mt-1 text-xs text-red-400">
                                {fieldErrors.organization_id}
                            </p>
                        )}
                    </div>

                    {/* Address (optional) */}
                    <div>
                        <label
                            htmlFor="outlet-address"
                            className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                            Address
                        </label>
                        <input
                            id="outlet-address"
                            name="address"
                            type="text"
                            placeholder="123 Main Street (optional)"
                            className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                        />
                        {fieldErrors.address && (
                            <p className="mt-1 text-xs text-red-400">
                                {fieldErrors.address}
                            </p>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-md border border-red-900/50 bg-red-950/50 px-3 py-2 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {loading ? "Creating…" : "Create Outlet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
