-- SAFE METHOD: Create Superadmin Using Supabase Auth API
-- 
-- Method 1: Use the invite-admin edge function (RECOMMENDED)
-- Method 2: Use Supabase Dashboard UI
-- Method 3: Use psql with service role

-- ============================================
-- METHOD 1: Create via Database Function (Safest)
-- ============================================

-- Create a function that properly creates a user
CREATE OR REPLACE FUNCTION create_superadmin_user(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT DEFAULT 'Super Admin'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Create user in auth.users with proper defaults
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        recovery_sent_at,
        banned_until,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NULL,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('full_name', p_full_name, 'role', 'superadmin'),
        FALSE,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        '',
        '',
        NULL,
        NULL,
        NULL,
        FALSE,
        NULL
    )
    RETURNING id INTO v_user_id;
    
    -- Create identity record (required for auth)
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', p_email),
        'email',
        NOW(),
        NOW(),
        NOW()
    );
    
    -- Create profile
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (v_user_id, p_email, p_full_name, 'superadmin')
    ON CONFLICT (id) DO UPDATE SET
        role = 'superadmin',
        full_name = p_full_name;
    
    RETURN v_user_id;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION create_superadmin_user(TEXT, TEXT, TEXT) TO service_role;

-- Now create the superadmin
SELECT create_superadmin_user('admin@bookpage.com', 'admin123', 'Super Admin');

-- ============================================
-- METHOD 2: Simple Insert (If Method 1 Fails)
-- ============================================
-- This is the most basic approach - just raw inserts

-- Clean up any partial inserts first
-- DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@bookpage.com');
-- DELETE FROM profiles WHERE email = 'admin@bookpage.com';
-- DELETE FROM auth.users WHERE email = 'admin@bookpage.com';

-- Basic insert (uncomment to run)
/*
WITH new_user AS (
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@bookpage.com',
        crypt('admin123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Super Admin", "role": "superadmin"}',
        NOW(),
        NOW()
    )
    RETURNING id, email
)
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Super Admin', 'superadmin'
FROM new_user;
*/

-- ============================================
-- VERIFY
-- ============================================
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at IS NOT NULL as confirmed,
    p.role,
    p.full_name,
    ai.provider
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN auth.identities ai ON au.id = ai.user_id
WHERE au.email = 'admin@bookpage.com';
