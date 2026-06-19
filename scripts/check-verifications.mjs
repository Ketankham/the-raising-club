import pg from 'pg';
const db = new pg.Client({
  host: 'db.xocomzqhlciukgodjptr.supabase.co',
  port: 5432, user: 'postgres', password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres', ssl: { rejectUnauthorized: false },
});
await db.connect();

const raw = await db.query(`SELECT v.id, v.user_id, v.type, v.status FROM verifications v LIMIT 20`);
console.log('Raw verifications rows:', raw.rowCount, raw.rows);

const joined = await db.query(`
  SELECT v.id, v.type, v.status, p.email, p.first_name
  FROM verifications v
  JOIN profiles p ON p.id = v.user_id
  LIMIT 20
`);
console.log('With profiles join:', joined.rowCount, joined.rows);

// Also check via Supabase REST using service role key
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const { data, error } = await supabase
  .from('verifications')
  .select('id, user_id, type, status, profiles!inner(first_name, email)')
  .order('updated_at', { ascending: false });
console.log('Supabase query result:', data?.length, error?.message);
if (data?.length) console.log('  First row:', JSON.stringify(data[0]));
if (error) console.log('  Full error:', error);

await db.end();
