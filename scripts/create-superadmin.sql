-- CREATE SUPERADMIN USER
-- 
-- This creates a superadmin with:
-- Email: admin@bookpage.com
-- Password: admin123
--
-- ⚠️  IMPORTANT: Change the password after first login!

-- Enable pgcrypto extension if not already enabled (for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 1: Create user in auth.users
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
    crypt('admin123', gen_salt('bf')),  -- Password: admin123 (bcrypt hashed)
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin","role":"superadmin"}',
    now(),
    now()
)
ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt('admin123', gen_salt('bf')),
    updated_at = now();

-- Step 2: Create/update profile
INSERT INTO profiles (id, email, full_name, role)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', 'Super Admin'),
    'superadmin'
FROM auth.users
WHERE email = 'admin@bookpage.com'
ON CONFLICT (id) DO UPDATE SET 
    role = 'superadmin',
    full_name = EXCLUDED.full_name;

-- Verify the superadmin was created
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at IS NOT NULL as email_confirmed,
    p.role,
    p.full_name
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@bookpage.com';
