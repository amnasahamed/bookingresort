-- CREATE SUPERADMIN USER (Fixed Version)
-- 
-- This creates a superadmin with:
-- Email: admin@bookpage.com
-- Password: admin123

-- Enable pgcrypto extension if not already enabled (for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 1: Create user in auth.users
-- First check if user exists
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@bookpage.com';
    
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
            'admin@bookpage.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Super Admin","role":"superadmin"}',
            now(),
            now()
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Created new user with ID: %', v_user_id;
    ELSE
        -- Update existing user's password
        UPDATE auth.users 
        SET encrypted_password = crypt('admin123', gen_salt('bf')),
            updated_at = now(),
            raw_user_meta_data = '{"full_name":"Super Admin","role":"superadmin"}'
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Updated existing user with ID: %', v_user_id;
    END IF;
    
    -- Step 2: Create/update profile
    -- Delete existing profile if exists (to avoid conflicts)
    DELETE FROM profiles WHERE id = v_user_id;
    
    -- Insert new profile
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        v_user_id,
        'admin@bookpage.com',
        'Super Admin',
        'superadmin'
    );
    
    RAISE NOTICE 'Profile created/updated for user ID: %', v_user_id;
END $$;

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
