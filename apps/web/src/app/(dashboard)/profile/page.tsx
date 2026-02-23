import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserContext } from "@/lib/auth/resolve-user-context";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
    const supabase = await createSupabaseServerClient();
    const ctx = await resolveUserContext(supabase);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-zinc-50">Profile Settings</h1>
            </div>
            <ProfileForm user={ctx.user} />
        </div>
    );
}
