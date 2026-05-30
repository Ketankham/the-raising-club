// Applies supabase/migrations/*.sql in order to the live database.
// Password is read from env (SUPABASE_DB_PASSWORD) — never hard-coded.
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD");
  process.exit(1);
}

const client = new pg.Client({
  host: "db.xocomzqhlciukgodjptr.supabase.co",
  port: 5432,
  user: "postgres",
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("Connected.\n");

const dir = path.join(process.cwd(), "supabase", "migrations");
// Optional CLI args = specific migrations to apply (prefix match), e.g.
//   node scripts/apply-migrations.mjs 0013 0014
// With no args, applies every migration in order.
const only = process.argv.slice(2);
const files = readdirSync(dir)
  .filter((f) => /^\d+_.*\.sql$/.test(f))
  .filter((f) => only.length === 0 || only.some((p) => f.startsWith(p)))
  .sort();

if (files.length === 0) {
  console.error("No matching migrations for:", only.join(", "));
  process.exit(1);
}

for (const f of files) {
  const sql = readFileSync(path.join(dir, f), "utf8");
  process.stdout.write(`Applying ${f} … `);
  try {
    await client.query(sql);
    console.log("ok");
  } catch (e) {
    console.log("FAILED");
    console.error("  →", e.message);
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log("\n✓ All migrations applied.");
