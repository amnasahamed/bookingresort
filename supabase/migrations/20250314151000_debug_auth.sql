-- Debug and fix auth issues

-- Check if profiles exist for all auth users
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.created_at,
    p.id as profile_id,
    p.role,
    p.full_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- If the above query returns rows, those users don't have profiles.
-- Run this to create missing profiles:
INSERT INTO profiles (id, email, full_name, role)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    COALESCE(au.raw_user_meta_data->>'role', 'admin')
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Verify all users have proper profiles
SELECT 
    au.email,
    p.role,
    au.email_confirmed_at IS NOT NULL as is_confirmed
FROM auth.users au
JOIN profiles p ON au.id = p.id;
