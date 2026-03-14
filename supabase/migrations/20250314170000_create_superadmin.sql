-- Create a Superadmin User (Fixed Version)
-- Run this in Supabase Dashboard SQL Editor

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- CREATE SUPERADMIN WITH PASSWORD
-- ============================================
-- Replace 'admin@bookpage.com' with your desired email
-- Replace 'admin123' with your desired password

DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'admin@bookpage.com';  -- CHANGE THIS
    v_password text := 'admin123';          -- CHANGE THIS
    v_full_name text := 'Super Admin';
BEGIN
    -- Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        -- Create new user
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
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('full_name', v_full_name, 'role', 'superadmin'),
            now(),
            now()
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Created new user with ID: %', v_user_id;
    ELSE
        -- Update existing user's password and metadata
        UPDATE auth.users 
        SET encrypted_password = crypt(v_password, gen_salt('bf')),
            updated_at = now(),
            raw_user_meta_data = jsonb_build_object('full_name', v_full_name, 'role', 'superadmin')
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Updated existing user with ID: %', v_user_id;
    END IF;
    
    -- Create/update profile
    -- First delete existing to avoid conflicts
    DELETE FROM profiles WHERE id = v_user_id;
    
    -- Insert new profile
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (v_user_id, v_email, v_full_name, 'superadmin');
    
    RAISE NOTICE 'Profile created/updated for user ID: %', v_user_id;
END $$;

-- ============================================
-- VERIFY CREATION
-- ============================================
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at IS NOT NULL as email_confirmed,
    p.role,
    p.full_name
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email = 'admin@bookpage.com';

-- ============================================
-- ALTERNATIVE: Create with specific UUID
-- ============================================
-- Use this if you want a specific user ID
/*
DO $$
DECLARE
    v_user_id uuid := 'your-specific-uuid-here';
BEGIN
    -- Delete existing user if exists
    DELETE FROM auth.users WHERE id = v_user_id;
    
    -- Insert new user
    INSERT INTO auth.users (
        instance_id, id, aud, role, email,
        encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        'admin@bookpage.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Super Admin","role":"superadmin"}',
        now(),
        now()
    );
    
    -- Delete and recreate profile
    DELETE FROM profiles WHERE id = v_user_id;
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (v_user_id, 'admin@bookpage.com', 'Super Admin', 'superadmin');
END $$;
*/

-- ============================================
-- PROMOTE EXISTING USER TO SUPERADMIN
-- ============================================
-- If you have an existing user, just run this:
/*
UPDATE profiles 
SET role = 'superadmin' 
WHERE email = 'existing-user@example.com';
*/
