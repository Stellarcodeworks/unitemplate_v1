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
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        // 2. Authorize (Super Admin only)
        // Check if user has 'super_admin' role in ANY outlet.
        const { count, error: roleError } = await supabase
            .from('outlet_users')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('role', 'super_admin')

        if (roleError || !count || count === 0) {
            return new Response(JSON.stringify({ error: 'Forbidden: Only Super Admins can create organizations' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 3. Parse Body
        const { name } = await req.json()
        if (!name) throw new Error('Organization name is required')

        // 4. Perform Mutations (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // A. Create Organization
        const { data: org, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({ name, created_by: user.id })
            .select()
            .single()

        if (orgError) throw orgError

        // B. Create Headquarters Outlet
        const { data: outlet, error: outletError } = await supabaseAdmin
            .from('outlets')
            .insert({
                organization_id: org.id,
                name: 'Headquarters',
                is_active: true,
                created_by: user.id
            })
            .select()
            .single()

        if (outletError) throw outletError

        // C. Assign Creator as Org Admin of the new Outlet
        const { error: assignError } = await supabaseAdmin
            .from('outlet_users')
            .insert({
                outlet_id: outlet.id,
                user_id: user.id,
                role: 'org_admin'
            })

        if (assignError) throw assignError

        return new Response(JSON.stringify({ organization: org, outlet }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (err) {
        return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
