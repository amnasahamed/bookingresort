-- Create a Superadmin User
-- Run this in Supabase Dashboard SQL Editor

-- ============================================
-- METHOD 1: Create Superadmin via Edge Function (Recommended)
-- ============================================
-- Use the invite-admin edge function from your app
-- Go to /superadmin/login and use "Forgot password" or invite flow

-- ============================================
-- METHOD 2: Manual SQL Insert (Dashboard Only)
-- ============================================
-- Replace these values:
-- :superadmin_email = 'your-email@example.com'
-- :superadmin_password_hash = '$2a$10$...' (bcrypt hash)
-- :superadmin_name = 'Your Name'

-- Step 1: Insert into auth.users
-- NOTE: Password must be properly bcrypt hashed. This is just a template.
-- For production, use the Supabase Dashboard Auth UI instead.

-- INSERT INTO auth.users (
--     instance_id,
--     id,
--     aud,
--     role,
--     email,
--     encrypted_password,
--     email_confirmed_at,
--     recovery_sent_at,
--     last_sign_in_at,
--     raw_app_meta_data,
--     raw_user_meta_data,
--     created_at,
--     updated_at,
--     confirmation_token,
--     email_change,
--     email_change_token_new,
--     recovery_token
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     gen_random_uuid(),
--     'authenticated',
--     'authenticated',
--     'superadmin@example.com',
--     '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890', -- bcrypt hash
--     now(),
--     now(),
--     now(),
--     '{"provider":"email","providers":["email"]}',
--     '{"full_name":"Super Admin","role":"superadmin"}',
--     now(),
--     now(),
--     '',
--     '',
--     '',
--     ''
-- );

-- Step 2: Create profile (trigger should do this automatically, but just in case)
-- INSERT INTO profiles (id, email, full_name, role)
-- SELECT 
--     id,
--     email,
--     COALESCE(raw_user_meta_data->>'full_name', email),
--     'superadmin'
-- FROM auth.users
-- WHERE email = 'superadmin@example.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

-- ============================================
-- METHOD 3: Promote Existing User to Superadmin (Easiest)
-- ============================================
-- If you already have a user, just update their role:

-- UPDATE profiles 
-- SET role = 'superadmin' 
-- WHERE email = 'your-email@example.com';

-- Then set their password via "Forgot Password" on the login page

-- ============================================
-- METHOD 4: Create Superadmin with Known Password (For Development)
-- ============================================
-- This creates a superadmin with email 'admin@bookpage.com' and password 'admin123'
-- ONLY FOR DEVELOPMENT - CHANGE PASSWORD IN PRODUCTION!

-- First, create the user
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
    crypt('admin123', gen_salt('bf')),  -- Password: admin123
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin","role":"superadmin"}',
    now(),
    now()
)
ON CONFLICT (email) DO NOTHING;

-- Create/update profile
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

-- Verify creation
SELECT 
    au.email,
    au.email_confirmed_at IS NOT NULL as confirmed,
    p.role,
    p.full_name
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@bookpage.com';
