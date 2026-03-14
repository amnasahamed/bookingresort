# Supabase + Vercel Integration Checklist

## 🔴 Critical Issues to Check

### 1. Environment Variables in Vercel

Your local `.env.local` has:
```
VITE_SUPABASE_URL=https://oscahatwnwgnccejrwft.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_6Yo061jzw57OsuHI5fDbyA_1u5B4W0I
```

**You MUST add these to Vercel:**
1. Go to https://vercel.com/dashboard
2. Select your project (`bookingresort`)
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `VITE_SUPABASE_URL` = `https://oscahatwnwgnccejrwft.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_6Yo061jzw57OsuHI5fDbyA_1u5B4W0I`
5. Click **Save** and **Redeploy**

---

### 2. Supabase Auth Redirect URLs

In Supabase Dashboard:
1. Go to https://app.supabase.com/project/oscahatwnwgnccejrwft
2. Go to **Authentication** → **URL Configuration**
3. Add your Vercel URLs to **Redirect URLs**:
   ```
   https://bookingresort-lime.vercel.app/**
   https://bookingresort-o1a3expis-amnaskt05-9950s-projects.vercel.app/**
   ```
4. Set **Site URL** to:
   ```
   https://bookingresort-lime.vercel.app
   ```

---

### 3. Verify Edge Function is Deployed

Run this command to check:
```bash
supabase functions list
```

If `invite-admin` is not listed, deploy it:
```bash
supabase functions deploy invite-admin
```

---

### 4. Verify Database Migrations Applied

Check if migrations are applied:
```bash
supabase db status
```

If not applied:
```bash
supabase db push
```

---

### 5. Check RLS Policies

In Supabase Dashboard SQL Editor, run:
```sql
-- Check RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'profiles';

-- Check policies exist
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';
```

You should see policies like:
- `Users can view own profile`
- `Users can update own profile`
- `Service role can manage all profiles`

---

## 🧪 Testing the Integration

### Test 1: Environment Variables
Open browser console on your Vercel deployment and check:
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```
Should show your URL, not `undefined`.

### Test 2: Auth Connection
```javascript
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data, error);
```

### Test 3: Database Query
```javascript
const { data, error } = await supabase.from('profiles').select('*').limit(1);
console.log('Profiles:', data, error);
```

---

## ⚠️ Common Errors & Fixes

### Error: "Failed to fetch" (Invite Feature)
- **Cause:** Edge function not deployed or CORS issue
- **Fix:** Deploy function: `supabase functions deploy invite-admin`

### Error: "Invalid login credentials"
- **Cause:** User doesn't exist or wrong password
- **Fix:** Check user exists in Auth → Users

### Error: "Access denied" after login
- **Cause:** Profile doesn't exist in database
- **Fix:** Run debug SQL in migrations/20250314151000_debug_auth.sql

### Error: "Error loading user profile"
- **Cause:** RLS policies blocking read
- **Fix:** Run migration: `supabase db push`

---

## ✅ Quick Verification Commands

```bash
# 1. Check Supabase is connected
supabase status

# 2. Deploy latest edge function
supabase functions deploy invite-admin

# 3. Push latest database changes
supabase db push

# 4. Check function logs
supabase functions logs invite-admin --tail
```

---

## 🔗 Important URLs

- **Supabase Dashboard:** https://app.supabase.com/project/oscahatwnwgnccejrwft
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Site:** https://bookingresort-lime.vercel.app
