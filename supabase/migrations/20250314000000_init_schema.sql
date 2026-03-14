-- Initialize Booking Resort Database Schema
-- This migration creates all necessary tables and sets up RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES TABLE (users metadata)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    price_per_night DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    whatsapp_number TEXT,
    instagram TEXT,
    map_link TEXT,
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    videos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on admin_id for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_admin_id ON public.properties(admin_id);
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug);

-- ============================================
-- CALENDARS TABLE (availability/booking status)
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_id, date)
);

-- Create index on property_id and date for faster queries
CREATE INDEX IF NOT EXISTS idx_calendars_property_id ON public.calendars(property_id);
CREATE INDEX IF NOT EXISTS idx_calendars_date ON public.calendars(date);

-- ============================================
-- BOOKINGS TABLE (future use)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on property_id for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - PROFILES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (for signups)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Allow service role to do everything (for edge functions)
CREATE POLICY "Service role manages all profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - PROPERTIES
-- ============================================
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view their own properties
CREATE POLICY "Admins can view own properties"
  ON public.properties FOR SELECT
  USING (
    auth.uid() = admin_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Policy: Admins can update their own properties
CREATE POLICY "Admins can update own properties"
  ON public.properties FOR UPDATE
  USING (
    auth.uid() = admin_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  )
  WITH CHECK (
    auth.uid() = admin_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Policy: Admins can insert properties
CREATE POLICY "Admins can insert properties"
  ON public.properties FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id
  );

-- Policy: Admins can delete their own properties
CREATE POLICY "Admins can delete own properties"
  ON public.properties FOR DELETE
  USING (
    auth.uid() = admin_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Policy: Anyone can view all properties (public listing)
CREATE POLICY "Anyone can view all properties"
  ON public.properties FOR SELECT
  USING (true);

-- Policy: Service role can manage all properties
CREATE POLICY "Service role manages all properties"
  ON public.properties FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - CALENDARS
-- ============================================
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view calendar (public availability)
CREATE POLICY "Anyone can view calendars"
  ON public.calendars FOR SELECT
  USING (true);

-- Policy: Property admins can update their calendar
CREATE POLICY "Admins can update own property calendars"
  ON public.calendars FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id 
      AND admin_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id 
      AND admin_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Policy: Property admins can insert calendar entries
CREATE POLICY "Admins can insert calendar entries"
  ON public.calendars FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id 
      AND admin_id = auth.uid()
    )
  );

-- Policy: Service role can manage all calendars
CREATE POLICY "Service role manages all calendars"
  ON public.calendars FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - BOOKINGS
-- ============================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view bookings (for availability check)
CREATE POLICY "Anyone can view bookings"
  ON public.bookings FOR SELECT
  USING (true);

-- Policy: Property admins can manage bookings for their properties
CREATE POLICY "Admins can manage own property bookings"
  ON public.bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id 
      AND admin_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id 
      AND admin_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Policy: Service role can manage all bookings
CREATE POLICY "Service role manages all bookings"
  ON public.bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS FOR AUTO-CREATED PROFILE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CREATE DEFAULT SUPERADMIN (if needed)
-- ============================================
-- This will be run as a separate step to avoid conflicts
