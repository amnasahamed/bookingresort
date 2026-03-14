# Quick Test Guide

## Database Fixes Applied

The following issues have been resolved:

1. **Database Schema Created** ✅
   - profiles table
   - properties table
   - calendars table
   - bookings table
   - All with proper indexes and RLS policies

2. **Superadmin User Created** ✅
   - Email: admin@bookpage.com
   - Password: admin123
   - Role: superadmin

3. **RLS Policies Fixed** ✅
   - Profiles: Users can view/update their own profile
   - Profiles: Superadmins can view all profiles
   - Properties: Everyone can view properties
   - Calendars: Proper access control
   - Bookings: Proper access control

## Testing

Try logging in with:
- Email: admin@bookpage.com
- Password: admin123

If you still see "Database error querying schema":
1. Try a hard refresh (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cookies for the Supabase domain
3. Check browser console for specific error details
4. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly in .env.local

## Debugging

If the error persists, the actual error message will be more specific. Look for:
- "Error loading user profile: [specific error]"
- "No profile found for this user"
- "Access denied: Your account role is..."

The system is designed to show you exactly what went wrong.
