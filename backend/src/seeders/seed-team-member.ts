import "dotenv/config";
import { hash } from "bcryptjs";
import { db } from "../database/pool.js";

// Set TEAM_MEMBER_SEED_EMAIL and TEAM_MEMBER_SEED_PASSWORD in backend/.env, then run npm run db:seed-member.
// Sign in at http://localhost:3000/login. Existing member passwords are not changed.
const fullName = process.env.TEAM_MEMBER_SEED_NAME?.trim();
const email = process.env.TEAM_MEMBER_SEED_EMAIL?.trim().toLowerCase();
const password = process.env.TEAM_MEMBER_SEED_PASSWORD;

if (!fullName || !email || !password) {
  throw new Error("Set TEAM_MEMBER_SEED_NAME, TEAM_MEMBER_SEED_EMAIL, and TEAM_MEMBER_SEED_PASSWORD in backend/.env before seeding.");
}
if (fullName.length < 2 || fullName.length > 120) {
  throw new Error("TEAM_MEMBER_SEED_NAME must be between 2 and 120 characters.");
}
if (!/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error("TEAM_MEMBER_SEED_EMAIL must be a valid email address.");
}
if (password.length < 12) {
  throw new Error("TEAM_MEMBER_SEED_PASSWORD must be at least 12 characters long.");
}

async function seedTeamMember(): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ user_id: string; role: string }>(
      "SELECT user_id, role FROM public.users WHERE lower(email)=lower($1) LIMIT 1 FOR UPDATE",
      [email],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].role !== "team_member") {
        throw new Error(`The account ${email} already exists with a different role. No changes were made.`);
      }
      console.log(`Team member ${email} already exists; the existing password and account were left unchanged.`);
    } else {
      const passwordHash = await hash(password!, 12);
      await client.query(
        `INSERT INTO public.users (full_name, email, password_hash, role)
         VALUES ($1, $2, $3, 'team_member')`,
        [fullName, email, passwordHash],
      );
      console.log(`Created team member ${email}.`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

void seedTeamMember().catch((error: unknown) => {
  const code = typeof error === "object" && error !== null && "code" in error ? ` (${String(error.code)})` : "";
  console.error(`Team member seed failed${code}:`, error instanceof Error ? error.message : "Unknown error.");
  process.exitCode = 1;
});
