import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Set it in backend/.env.");
}

export const db = new Pool({ connectionString });

export async function checkDatabaseConnection(): Promise<void> {
  await db.query("SELECT 1");
}
