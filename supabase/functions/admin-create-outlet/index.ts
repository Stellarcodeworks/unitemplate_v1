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

        const { name, organization_id, address } = await req.json()
        if (!name || !organization_id) throw new Error('Missing require fields')

        // 2. Check Permissions (Must be Org Admin or Super Admin)
        // We can't trust the client to tell us role. We must check DB.
        // However, RLS prevents reading other people's roles easily? 
        // Wait, "Outlet memberships viewable by outlet colleagues".
        // If I am Org Admin, I am member of... wait, Org Admin is assigned to an Outlet usually (HQ).
        // Does Org Admin implies access to ALL outlets? The Plan says "Organization: Top-level".
        // "Members of an organization can view it."

        // For creating an outlet, strictly speaking, who can do it?
        // "Org Admin".
        // How do we verify "Org Admin"?
        // Query `outlet_users` where user_id = me AND role IN ('org_admin', 'super_admin').
        // If count > 0, allowed.

        const { data: roles, error: roleError } = await supabaseClient
            .from('outlet_users')
            .select('role')
            .eq('user_id', user.id)
            .in('role', ['org_admin', 'super_admin'])

        if (roleError) throw roleError;
        if (!roles || roles.length === 0) {
            return new Response(JSON.stringify({ error: 'Forbidden: Insufficient privileges' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 3. Perform Logic (Create Outlet)
        // Use Service Role to bypass RLS (since we don't have INSERT permissions on outlets table for authenticated users)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: newOutlet, error: createError } = await supabaseAdmin
            .from('outlets')
            .insert({
                name,
                organization_id,
                address,
                created_by: user.id
            })
            .select()
            .single()

        if (createError) throw createError

        return new Response(JSON.stringify(newOutlet), {
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
