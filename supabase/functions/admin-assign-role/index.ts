import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Get User
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        const { user_email, outlet_id, role, full_name } = await req.json()
        if (!user_email || !outlet_id || !role) throw new Error('Missing require fields')

        // 2. Check Permissions (Handled by RLS/Trigger, OR we enforce here too)
        // Since we are using Service Role for the action (to create user if not exists),
        // we MUST enforce permissions here strictly.
        // Rule: "I can assign role X if I have role > X in this outlet" (Roughly).
        // Or stricter: "Only Admins can use this function".
        // Let's rely on `has_admin_role_in_outlet` logic conceptually.

        // We check if caller is an admin for this outlet.
        const { data: myRoles } = await supabaseClient
            .from('outlet_users')
            .select('role')
            .eq('user_id', user.id)
            .eq('outlet_id', outlet_id)
            .in('role', ['org_admin', 'outlet_admin', 'manager'])
        // Managers can add staff.

        if (!myRoles || myRoles.length === 0) {
            return new Response(JSON.stringify({ error: 'Forbidden: You are not an admin/manager of this outlet' }), { status: 403, headers: corsHeaders })
        }

        // 3. Logic: Find or Create User
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Check if user exists by email
        // Admin API required to search users by email? 
        // Or we try to invite? 
        // "admin-assign-role" usually implies existing user or invite flow.
        // Let's assume invite workflow: `supabaseAdmin.auth.admin.inviteUserByEmail`?
        // Or `createUser`?

        // Simplification for Phase 3: We assume we are just linking existing user or creating a placeholder?
        // Let's use `listUsers` to find by email? (Expensive).

        // Better: Just try to INSERT into `outlet_users` using the ID.
        // Wait, we only have Email.
        // We need to resolve Email -> ID.
        // This requires `supabaseAdmin.rpc` or `auth.admin`.

        // Let's try `inviteUserByEmail` which returns the user (existing or new).
        // This sends an email. Maybe user doesn't want that in dev?
        // Alternative: `createUser` (auto-confirm).

        const { data: targetUser, error: searchError } = await supabaseAdmin.auth.admin.createUser({
            email: user_email,
            email_confirm: true,
            user_metadata: { full_name: full_name || '' }
        })

        // If error says "Email already registered", we need to fetch that user.
        let targetUserId = targetUser?.user?.id;

        if (searchError) {
            // If user exists, we need to find their ID. 
            // We can't easily query auth.users without potentially scanning.
            // But we are service role.
            // We can cheat: `supabaseAdmin.from('profiles').select('id').eq('email', user_email)`
            // Since profile is 1:1 with user.
            const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('email', user_email).single();
            if (profile) targetUserId = profile.id;
            else throw new Error('User exists but profile not found? ' + searchError.message);
        }

        if (!targetUserId) throw new Error('Could not resolve target user ID');

        // 4. Insert Role
        // This checks constraints (unique user/outlet) AND Trigger (Hierarchy).
        // We use `supabaseClient` (Authenticated) if we want to trigger RLS checks?
        // NO. If we use `supabaseClient`, RLS applies.
        // RLS: "Admins can add users... WITH CHECK has_admin_role_in_outlet".
        // Since we verified permission in Step 2 manually, we *could* use `supabaseAdmin` to bypass RLS 
        // but then we bypass the Hierarchy Trigger logic IF the trigger uses `auth.uid()`.
        // The Hierarchy Trigger DOES start with: `IF auth.uid() IS NULL THEN RETURN NEW; END IF;`
        // If we use service role client, `auth.uid()` is usually NULL (unless we spoof it).

        // Better to use `supabaseClient` (acting as the caller) to insert into `outlet_users`.
        // This ensures RLS + Triggers run with the correct context.
        // But we need to make sure we have INSERT permission.
        // Migration 006 gave INSERT permission to Authenticated users IF `has_admin_role_in_outlet`.
        // So `supabaseClient` should work!

        // PROBLEM: `targetUser` might just have been created by `supabaseAdmin`.
        // The `profiles` table might not be populated yet if it relies on a Trigger on `auth.users`.
        // (We don't have that trigger in our migrations! 001 just creates the table. 
        // We rely on client or service to create profile).
        // So if new user, `supabaseAdmin` created `auth.users` row.
        // We should also create `public.profiles` row if missing.

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({ id: targetUserId, email: user_email, full_name: full_name || user_email })

        if (profileError) console.log('Profile upsert warning:', profileError)

        // Now insert role as the Caller
        const { data: newRole, error: roleInsertError } = await supabaseClient
            .from('outlet_users')
            .insert({
                user_id: targetUserId,
                outlet_id: outlet_id,
                role: role
            })
            .select()
            .single()

        if (roleInsertError) throw roleInsertError

        return new Response(JSON.stringify(newRole), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
