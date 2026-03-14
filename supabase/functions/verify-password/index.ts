import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Create Supabase client with service role key for admin access
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        );

        // Fetch user by email
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, email, full_name, role, password_hash')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (profileError || !profile) {
            return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Verify password
        let isValid = false;
        if (profile.password_hash) {
            isValid = await bcrypt.compare(password, profile.password_hash);
        } else {
            // Fallback for accounts without hash set (legacy)
            isValid = password === 'admin123';
        }

        if (!isValid) {
            return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Return user data (without sensitive fields)
        return new Response(JSON.stringify({
            success: true,
            user: {
                id: profile.id,
                email: profile.email,
                full_name: profile.full_name,
                role: profile.role,
            }
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Verify password error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
