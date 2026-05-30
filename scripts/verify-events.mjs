// One-off: verify the events schema (0013/0014/0015) landed.
import pg from "pg";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) { console.error("Set SUPABASE_DB_PASSWORD"); process.exit(1); }
const client = new pg.Client({
  host: "db.xocomzqhlciukgodjptr.supabase.co",
  port: 5432, user: "postgres", password, database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const q = async (label, sql) => console.log(label, (await client.query(sql)).rows);

await q("events.is_featured + agenda:", `
  select column_name, data_type from information_schema.columns
  where table_name='events' and column_name in ('is_featured','agenda') order by 1;`);

await q("event_resources.file_path + url nullable:", `
  select column_name, is_nullable from information_schema.columns
  where table_name='event_resources' and column_name in ('url','file_path') order by 1;`);

await q("resource_kind values:", `
  select enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid
  where t.typname='resource_kind' order by e.enumsortorder;`);

await q("event_saves table + rls:", `
  select tablename, rowsecurity from pg_tables where schemaname='public' and tablename='event_saves';`);

await q("event_saves policies:", `
  select policyname from pg_policies where schemaname='public' and tablename='event_saves' order by 1;`);

await client.end();
