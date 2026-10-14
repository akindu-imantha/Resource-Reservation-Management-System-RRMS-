import "dotenv/config";
import { hash } from "bcryptjs";
import { db } from "../database/pool.js";

// Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in backend/.env, then run npm run db:seed-admin.
// Sign in at http://localhost:3000/login. Existing admin passwords are not changed.
const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_SEED_PASSWORD;
const fullName = process.env.ADMIN_SEED_NAME?.trim();

if (!email || !password || !fullName) {
  throw new Error("Set ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, and ADMIN_SEED_NAME in backend/.env before seeding.");
}
if (password.length < 12) {
  throw new Error("ADMIN_SEED_PASSWORD must be at least 12 characters long.");
}

async function seedAdmin(): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ user_id: string; role: string }>(
      "SELECT user_id, role FROM public.users WHERE lower(email) = lower($1) LIMIT 1",
      [email],
    );

    let userId: string;
    if (existing.rows[0]) {
      if (existing.rows[0].role !== "admin") {
        throw new Error(`The account ${email} already exists without the admin role. No changes were made.`);
      }
      userId = existing.rows[0].user_id;
      await client.query(
        "INSERT INTO public.admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
        [userId],
      );
      console.log(`Admin account ${email} is already set up; no password was changed.`);
    } else {
      const passwordHash = await hash(password!, 12);
      const created = await client.query<{ user_id: string }>(
        `INSERT INTO public.users (full_name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin') RETURNING user_id`,
        [fullName, email, passwordHash],
      );
      const createdUser = created.rows[0];
      if (!createdUser) throw new Error("The database did not return the new admin user ID.");
      userId = createdUser.user_id;
      await client.query("INSERT INTO public.admins (user_id) VALUES ($1)", [userId]);
      console.log(`Created the initial admin account ${email}.`);

    }
    await client.query(
      `INSERT INTO public.teams (team_name, description)
       VALUES ('Roomly Demo Team', 'Sample team for trying the resource reservation workspace.')
       ON CONFLICT (team_name) DO NOTHING`,
    );
    await client.query(
      `INSERT INTO public.resource_categories (category_name, description) VALUES
         ('Meeting rooms', 'Spaces for focused work, meetings, and workshops.'),
         ('Equipment', 'Shared equipment available for team use.'),
         ('Workspaces', 'Flexible desks and collaborative areas.')
       ON CONFLICT (category_name) DO NOTHING`,
    );
    await client.query(
      `INSERT INTO public.resources (category_id, name, description, capacity, location, type)
       SELECT c.category_id, sample.name, sample.description, sample.capacity, sample.location, sample.type
         FROM (VALUES
           ('Meeting rooms', 'Cedar Meeting Room', 'A quiet room for small team meetings.', 8, 'Level 2', 'room'),
           ('Meeting rooms', 'Ocean Conference Room', 'A presentation-ready conference room.', 14, 'Level 3', 'room'),
           ('Equipment', 'Projector Kit', 'Portable projector with HDMI and USB-C adapters.', 1, 'IT Store', 'equipment'),
           ('Equipment', 'Video Conference Kit', 'Camera and speakerphone for hybrid meetings.', 1, 'IT Store', 'equipment'),
           ('Workspaces', 'Collaboration Table', 'Shared table for pair work and small sessions.', 6, 'Level 1', 'workspace')
         ) AS sample(category_name, name, description, capacity, location, type)
         JOIN public.resource_categories AS c ON c.category_name = sample.category_name
        WHERE NOT EXISTS (SELECT 1 FROM public.resources AS r WHERE r.name = sample.name)`,
    );
    console.log("Sample team, resource categories, and resources are ready.");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

void seedAdmin().catch((error: unknown) => {
  console.error("Admin seed failed:", error instanceof Error ? error.message : "Unknown error.");
  process.exitCode = 1;
});
