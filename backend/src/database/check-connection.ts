import { db } from "./pool.js";

async function checkConnection(): Promise<void> {
  try {
    await db.query("SELECT 1");
    console.log("Database connection successful.");
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "unknown";
    const reasons: Record<string, string> = {
      "28P01": "The database rejected the password.",
      "3D000": "The database name does not exist.",
      SELF_SIGNED_CERT_IN_CHAIN: "Install the Supabase root certificate and check DATABASE_CA_CERT.",
      ENOTFOUND: "The database hostname could not be resolved.",
      ECONNREFUSED: "The server refused the connection.",
      ETIMEDOUT: "The connection timed out.",
    };
    console.error(`Database connection failed (${code}): ${reasons[code] ?? "Check the backend database configuration."}`);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

void checkConnection();
