-- WARNING: This script removes ALL admin and superadmin users
-- Run the SELECT queries first to see what will be deleted!

-- Step 1: Preview what will be deleted (SAFETY CHECK)
SELECT 
    au.id,
    au.email,
    au.created_at,
    p.role,
    p.full_name
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE p.role IN ('admin', 'superadmin');

-- Step 2: Delete from profiles first (due to foreign key constraints)
-- DELETE FROM profiles 
-- WHERE role IN ('admin', 'superadmin');

-- Step 3: Delete from auth.users
-- NOTE: Deleting from auth.users will cascade delete from profiles
-- if you have ON DELETE CASCADE, but let's be explicit

-- DELETE FROM auth.users 
-- WHERE id IN (
--     SELECT au.id
--     FROM auth.users au
--     JOIN profiles p ON au.id = p.id
--     WHERE p.role IN ('admin', 'superadmin')
-- );

-- ============================================
-- ALTERNATIVE: Soft delete (disable users instead)
-- This prevents login but keeps data intact
-- ============================================

-- Disable all admin/superadmin accounts:
-- UPDATE auth.users 
-- SET raw_app_meta_data = raw_app_meta_data || '{"disabled": true}'::jsonb
-- WHERE id IN (
--     SELECT au.id
--     FROM auth.users au
--     JOIN profiles p ON au.id = p.id
--     WHERE p.role IN ('admin', 'superadmin')
-- );

-- ============================================
-- ALTERNATIVE: Delete specific user by email
-- ============================================

-- DELETE FROM auth.users 
-- WHERE email = 'user@example.com';

-- Or delete multiple specific users:
-- DELETE FROM auth.users 
-- WHERE email IN ('admin1@example.com', 'admin2@example.com');
