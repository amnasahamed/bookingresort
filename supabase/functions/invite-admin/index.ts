import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { 
            status: 204, 
            headers: corsHeaders 
        });
    }

    try {
        // Only the Supabase service role key can invite users
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Verify the caller is an authenticated superadmin
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !caller) {
            console.error('Auth verification failed:', authError?.message || 'No user found for token');
            return new Response(JSON.stringify({
                error: 'Unauthorized: Invalid JWT or Session Expired',
                details: authError?.message
            }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Check caller is a superadmin
        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', caller.id)
            .single();

        if (profileError || callerProfile?.role !== 'superadmin') {
            const msg = profileError ? profileError.message : 'User is not a superadmin';
            console.error('Superadmin check failed:', msg);
            return new Response(JSON.stringify({
                error: 'Forbidden: Superadmin privileges required',
                details: msg
            }), {
                status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Parse body
        const { email, name, role = 'admin' } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Send invite email via Supabase Auth
        const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { full_name: name, role }
        });

        if (inviteError) {
            console.error('Invitation error:', inviteError.message);
            return new Response(JSON.stringify({ error: inviteError.message }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!invited?.user) {
            console.error('Invitation succeeded but no user returned');
            return new Response(JSON.stringify({ error: 'Failed to create user' }), {
                status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Create or update the profile row immediately
        const { error: profileUpsertError } = await supabaseAdmin.from('profiles').upsert({
            id: invited.user.id,
            email,
            full_name: name,
            role,
        });

        if (profileUpsertError) {
            console.error('Profile upsert error:', profileUpsertError.message);
            return new Response(JSON.stringify({ error: `User invited but profile creation failed: ${profileUpsertError.message}` }), {
                status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true, userId: invited.user.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Unexpected error in function:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
