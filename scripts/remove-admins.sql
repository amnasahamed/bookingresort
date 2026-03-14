-- REMOVE ALL ADMIN & SUPERADMIN USERS FROM SUPABASE
-- ⚠️  WARNING: This permanently deletes users! They cannot be recovered!

-- First, let's see what will be deleted:
SELECT 
    au.id,
    au.email,
    au.created_at,
    p.role,
    p.full_name
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE p.role IN ('admin', 'superadmin');

-- If you're sure you want to delete them, uncomment and run below:

-- Step 1: Delete from auth.users (this will also delete from profiles due to CASCADE)
-- DELETE FROM auth.users 
-- WHERE id IN (
--     SELECT au.id
--     FROM auth.users au
--     JOIN profiles p ON au.id = p.id
--     WHERE p.role IN ('admin', 'superadmin')
-- );

-- ============================================
-- QUICK DELETE (if you want to delete immediately)
-- Uncomment the lines below (remove -- at start of each line):
-- ============================================

-- DELETE FROM auth.users 
-- WHERE id IN (
--     SELECT au.id
--     FROM auth.users au
--     JOIN profiles p ON au.id = p.id
--     WHERE p.role IN ('admin', 'superadmin')
-- );
