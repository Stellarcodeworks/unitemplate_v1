"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import type { Role } from "@eop/access";
import { canAssignRole, ALL_ROLES } from "@eop/access";
import { useSupabase } from "@/hooks/use-supabase";
import { ROLE_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";

/**
 * Zod schema for the assign-role form.
 * Matches the Edge Function expected payload.
 */
const assignRoleSchema = z.object({
    user_email: z.string().email("Valid email is required"),
    full_name: z.string().min(1, "Name is required").max(100),
    outlet_id: z.string().uuid(),
    role: z.enum(["staff", "manager", "outlet_admin", "org_admin"]),
});

/**
 * Dialog for assigning a role to a user (add user to outlet).
 * Calls the admin-assign-role Edge Function.
 * Respects canAssignRole() for role filtering.
 */
export function AssignRoleDialog({
    outletId,
    assignerRole,
    onClose,
}: {
    outletId: string;
    assignerRole: Role;
    onClose: () => void;
}) {
    const supabase = useSupabase();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Filter assignable roles
    const assignableRoles = ALL_ROLES.filter(
        (role) => role !== "super_admin" && canAssignRole(assignerRole, role),
    );

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        const formData = new FormData(e.currentTarget);
        const rawData = {
            user_email: formData.get("user_email") as string,
            full_name: formData.get("full_name") as string,
            outlet_id: outletId,
            role: formData.get("role") as string,
        };

        // Zod validation
        const result = assignRoleSchema.safeParse(rawData);
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
                "admin-assign-role",
                { body: result.data },
            );

            if (fnError) {
                // Structured status check
                const status =
                    (fnError as Record<string, unknown>).context &&
                        typeof (fnError as Record<string, unknown>).context === "object"
                        ? ((fnError as Record<string, unknown>).context as Record<string, unknown>)
                            .status
                        : undefined;

                if (status === 403) {
                    toast.error("Insufficient permissions to assign this role.");
                } else {
                    setError(fnError.message || "Failed to assign role.");
                }
                return;
            }

            // Check for error in response body
            if (data?.error) {
                if (data.status === 403) {
                    toast.error("Insufficient permissions to assign this role.");
                } else {
                    setError(data.error);
                }
                return;
            }

            toast.success("User added to outlet successfully.");
            queryClient.invalidateQueries({ queryKey: ["outlet-users", outletId] });
            onClose();
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
                    <h2 className="text-lg font-semibold text-zinc-50">Add User</h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Email */}
                    <div>
                        <label
                            htmlFor="assign-email"
                            className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                            Email <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="assign-email"
                            name="user_email"
                            type="email"
                            required
                            placeholder="user@example.com"
                            className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                        />
                        {fieldErrors.user_email && (
                            <p className="mt-1 text-xs text-red-400">
                                {fieldErrors.user_email}
                            </p>
                        )}
                    </div>

                    {/* Full Name */}
                    <div>
                        <label
                            htmlFor="assign-name"
                            className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                            Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="assign-name"
                            name="full_name"
                            type="text"
                            required
                            placeholder="John Doe"
                            className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                        />
                        {fieldErrors.full_name && (
                            <p className="mt-1 text-xs text-red-400">
                                {fieldErrors.full_name}
                            </p>
                        )}
                    </div>

                    {/* Role */}
                    <div>
                        <label
                            htmlFor="assign-role"
                            className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                            Role <span className="text-red-400">*</span>
                        </label>
                        <select
                            id="assign-role"
                            name="role"
                            required
                            defaultValue=""
                            className="block w-full cursor-pointer rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                        >
                            <option value="" disabled>
                                Select a role…
                            </option>
                            {assignableRoles.map((role) => (
                                <option key={role} value={role}>
                                    {ROLE_LABELS[role] ?? role}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.role && (
                            <p className="mt-1 text-xs text-red-400">{fieldErrors.role}</p>
                        )}
                        <p className="mt-1 text-xs text-zinc-500">
                            You can only assign roles below your own level.
                        </p>
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
                            disabled={loading || assignableRoles.length === 0}
                            className="flex items-center gap-2 rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {loading ? "Adding…" : "Add User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
