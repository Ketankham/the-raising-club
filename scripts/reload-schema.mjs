import pg from 'pg';
const db = new pg.Client({
  host: 'db.xocomzqhlciukgodjptr.supabase.co',
  port: 5432, user: 'postgres', password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres', ssl: { rejectUnauthorized: false },
});
await db.connect();
await db.query(`NOTIFY pgrst, 'reload schema'`);
console.log('PostgREST schema reload notified');
await db.end();
