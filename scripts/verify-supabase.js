// Verification script for Supabase + Vercel integration
// Run this in browser console on your deployed site

async function verifySupabaseConnection() {
  console.log('🔍 Checking Supabase Connection...\n');
  
  // Check 1: Environment variables
  console.log('1️⃣ Environment Variables:');
  console.log('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || '❌ NOT SET');
  console.log('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');
  
  // Check 2: Supabase client
  console.log('\n2️⃣ Supabase Client:');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.log('   ❌ Session error:', sessionError.message);
  } else {
    console.log('   ✅ Session fetched:', sessionData.session ? 'Active session' : 'No session');
  }
  
  // Check 3: Database connection
  console.log('\n3️⃣ Database Connection:');
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);
  
  if (profileError) {
    console.log('   ❌ Database error:', profileError.message);
    console.log('   Code:', profileError.code);
  } else {
    console.log('   ✅ Database connected');
  }
  
  // Check 4: Edge function
  console.log('\n4️⃣ Edge Function (invite-admin):');
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-admin`, {
      method: 'OPTIONS'
    });
    if (response.status === 204 || response.status === 200) {
      console.log('   ✅ Edge function reachable (CORS OK)');
    } else {
      console.log('   ⚠️ Edge function returned:', response.status);
    }
  } catch (e) {
    console.log('   ❌ Edge function error:', e.message);
  }
  
  console.log('\n✅ Verification complete!');
}

// Run it
verifySupabaseConnection();
