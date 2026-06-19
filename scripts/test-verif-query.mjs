// Tests the listVerifications query step by step to find which part breaks
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) { console.error('SUPABASE_SERVICE_ROLE_KEY not set — add it to .env.local'); process.exit(0); }

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Test 1: basic select without new columns
const t1 = await supabase.from('verifications').select('id, user_id, type, status, provider, updated_at').limit(5);
console.log('Test 1 (basic):', t1.data?.length ?? 0, 'rows', t1.error?.message ?? 'ok');

// Test 2: include new columns from 0043
const t2 = await supabase.from('verifications').select('id, type, status, admin_review_required, reviewed_at, metadata').limit(5);
console.log('Test 2 (0043 cols):', t2.data?.length ?? 0, 'rows', t2.error?.message ?? 'ok');

// Test 3: profiles!inner join
const t3 = await supabase.from('verifications').select('id, type, status, profiles!inner(email)').limit(5);
console.log('Test 3 (profiles join):', t3.data?.length ?? 0, 'rows', t3.error?.message ?? 'ok');
if (t3.data?.length) console.log('  Sample:', JSON.stringify(t3.data[0]));

// Test 4: full query
const t4 = await supabase
  .from('verifications')
  .select('id, user_id, type, status, provider, admin_review_required, reviewed_at, metadata, updated_at, profiles!inner(first_name, last_name, preferred_name, email, deactivated_at, caregiver_profiles(is_published))')
  .order('updated_at', { ascending: false })
  .limit(10);
console.log('Test 4 (full query):', t4.data?.length ?? 0, 'rows', t4.error?.message ?? 'ok');
if (t4.error) console.log('  Error details:', t4.error);
