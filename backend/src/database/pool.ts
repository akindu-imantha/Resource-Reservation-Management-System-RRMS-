import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Set it in backend/.env.");
}

const databaseUrl = new URL(connectionString);
const usesSupabase = databaseUrl.hostname.endsWith(".supabase.com");
let ssl: { ca: string } | undefined;

if (usesSupabase) {
  const certificatePath = process.env.DATABASE_CA_CERT;
  if (!certificatePath) {
    throw new Error("DATABASE_CA_CERT is required for Supabase. Download the project's root certificate from Supabase Dashboard > Database settings.");
  }
  try {
    ssl = { ca: readFileSync(resolve(process.cwd(), certificatePath), "utf8") };
  } catch {
    throw new Error(`Cannot read DATABASE_CA_CERT at ${certificatePath}. Download the project's root certificate and check the path.`);
  }
}

// pg-connection-string replaces the explicit TLS options when SSL parameters
// are also present in the URL, so use the certificate supplied above alone.
databaseUrl.searchParams.delete("sslmode");
databaseUrl.searchParams.delete("sslrootcert");

export const db = new Pool({
  connectionString: databaseUrl.toString(),
  ssl,
});

export async function checkDatabaseConnection(): Promise<void> {
  await db.query("SELECT 1");
}
