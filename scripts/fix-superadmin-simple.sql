-- SIMPLE FIX: Create or Fix Superadmin
-- Run this if you're getting "Database error querying schema"

-- Step 1: Clean up any broken records
DELETE FROM auth.identities 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'admin@bookpage.com'
);

DELETE FROM profiles 
WHERE email = 'admin@bookpage.com';

DELETE FROM auth.users 
WHERE email = 'admin@bookpage.com';

-- Step 2: Create user with ALL required fields
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
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    is_sso_user
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@bookpage.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin","role":"superadmin"}',
    false,
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    false
);

-- Step 3: Create the identity record (CRITICAL for login)
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT 
    au.id::text,
    au.id,
    jsonb_build_object('sub', au.id::text, 'email', au.email),
    'email',
    NOW(),
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'admin@bookpage.com'
AND NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = au.id
);

-- Step 4: Create profile
INSERT INTO profiles (id, email, full_name, role)
SELECT 
    id,
    email,
    'Super Admin',
    'superadmin'
FROM auth.users
WHERE email = 'admin@bookpage.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    full_name = 'Super Admin';

-- Step 5: Verify everything
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at IS NOT NULL as confirmed,
    p.role,
    p.full_name,
    EXISTS(SELECT 1 FROM auth.identities i WHERE i.user_id = au.id) as has_identity
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@bookpage.com';
