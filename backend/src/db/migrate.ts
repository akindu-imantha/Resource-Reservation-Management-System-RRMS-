import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { db } from "./pool.js";

const migrationsDirectory = resolve(process.cwd(), "migrations");
const migrationNamePattern = /^\d{14}_[a-z0-9_]+\.sql$/;
const initialSchemaTables = [
  "users",
  "admins",
  "teams",
  "team_members",
  "resource_categories",
  "resources",
  "reservations",
];

async function migrate(): Promise<void> {
  const client = await db.connect();
  let lockAcquired = false;

  try {
    await client.query("SELECT pg_advisory_lock(hashtext('rrms:backend:migrations')::bigint)");
    lockAcquired = true;

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.backend_migrations (
        version text PRIMARY KEY,
        filename text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const filenames = (await readdir(migrationsDirectory))
      .filter((filename) => filename.endsWith(".sql"))
      .sort();

    for (const filename of filenames) {
      if (!migrationNamePattern.test(filename)) {
        throw new Error(`Invalid migration filename: ${filename}. Use YYYYMMDDHHMMSS_description.sql.`);
      }
    }

    const appliedResult = await client.query<{ version: string }>(
      "SELECT version FROM public.backend_migrations",
    );
    const applied = new Set(appliedResult.rows.map((row) => row.version));

    if (applied.size === 0 && filenames[0]?.endsWith("_initial_schema.sql")) {
      const existingTables = await client.query<{ table_name: string }>(
        `SELECT table_name
           FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            AND table_name = ANY($1::text[])
          ORDER BY table_name`,
        [initialSchemaTables],
      );

      if (existingTables.rows.length > 0) {
        throw new Error(
          `Initial schema was not applied: these RRMS tables already exist without migration history: ${existingTables.rows.map((row) => row.table_name).join(", ")}. Inspect the database before proceeding.`,
        );
      }
    }

    let appliedCount = 0;
    for (const filename of filenames) {
      const version = filename.slice(0, 14);
      if (applied.has(version)) continue;

      const sql = await readFile(resolve(migrationsDirectory, filename), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO public.backend_migrations (version, filename) VALUES ($1, $2)",
          [version, filename],
        );
        await client.query("COMMIT");
        appliedCount += 1;
        console.log(`Applied migration ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log(appliedCount === 0 ? "Database is up to date." : `Applied ${appliedCount} migration(s).`);
  } finally {
    if (lockAcquired) {
      await client.query("SELECT pg_advisory_unlock(hashtext('rrms:backend:migrations')::bigint)");
    }
    client.release();
    await db.end();
  }
}

void migrate().catch((error: unknown) => {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "unknown";
  const message = error instanceof Error ? error.message : "Unknown migration error.";
  console.error(`Database migration failed (${code}): ${message}`);
  process.exitCode = 1;
});
