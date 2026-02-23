"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/hooks/use-supabase";
import { toast } from "sonner";
import { Loader2, Save, User } from "lucide-react";

interface ProfileFormProps {
    user: {
        id: string;
        email: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const supabase = useSupabase();

    const [fullName, setFullName] = useState(user.full_name);
    const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
    const [saving, setSaving] = useState(false);

    const hasChanges =
        fullName !== user.full_name ||
        (avatarUrl || null) !== (user.avatar_url || null);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!hasChanges) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: fullName.trim(),
                    avatar_url: avatarUrl.trim() || null,
                })
                .eq("id", user.id);

            if (error) {
                toast.error(`Failed to update profile: ${error.message}`);
                return;
            }

            toast.success("Profile updated successfully");
            router.refresh();
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
                <div className="border-b border-zinc-800 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-zinc-500" />
                        <h2 className="text-lg font-semibold text-zinc-50">Public Profile</h2>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">
                        Manage your public profile information.
                    </p>
                </div>

                <form onSubmit={handleSave} className="space-y-6 p-6">
                    {/* Email (Read-only) */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                            Email
                        </label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="block w-full cursor-not-allowed rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 opacity-75 focus:outline-none"
                        />
                        <p className="mt-1.5 text-xs text-zinc-500">
                            Email addresses cannot be changed here. Contact support for help.
                        </p>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label
                            htmlFor="full_name"
                            className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                            Full Name
                        </label>
                        <input
                            id="full_name"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                            placeholder="Your full name"
                        />
                    </div>

                    {/* Avatar URL */}
                    <div>
                        <label
                            htmlFor="avatar_url"
                            className="mb-1.5 block text-sm font-medium text-zinc-300"
                        >
                            Avatar URL
                        </label>
                        <input
                            id="avatar_url"
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                            placeholder="https://example.com/avatar.png"
                        />
                        <p className="mt-1.5 text-xs text-zinc-500">
                            Enter a publicly accessible URL for your avatar image.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={!hasChanges || saving}
                            className="flex items-center gap-2 rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
