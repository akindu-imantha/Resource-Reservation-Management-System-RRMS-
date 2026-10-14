# Resource Reservation Management System

Next.js and TypeScript frontend with a separate TypeScript API backend.

## Project layout

- `frontend/src/pages/` — Next.js Pages Router routes for public, member, and admin pages.
- `frontend/src/components/` — shared layout and workspace interfaces.
- `backend/src/` — Express and TypeScript API grouped into routes, controllers, services, and database models; authorization is enforced by the API.
- `docs/rrms-erd.drawio` — current ER diagram.
- `docs/roles.md` — role responsibilities and access rules.

The assessment specifies the Next.js App Router. The current frontend uses the Pages Router, so this is an outstanding architecture difference to address before submission.

## Setup

1. Install Node.js 20 or later.
2. Copy `.env.example` to `backend/.env` and set `DATABASE_URL`. For Supabase, use the Session Pooler URI from **Project Settings → Database → Connection string**. Download the project's root certificate from **Database Settings**, save it under `backend/certs/`, and set `DATABASE_CA_CERT` to that file's path relative to `backend` in `backend/.env`.
3. Copy `frontend/.env.example` to `frontend/.env.local`.
4. Run `npm install` from the repository root.
5. Start the API with `npm run dev:backend` and the frontend with `npm run dev:frontend` in separate terminals.
6. Verify the database connection without changing its schema with `npm run db:check --workspace backend`.

## Database migrations

SQL migrations in `backend/migrations/` are the source of truth for database schema changes. The initial schema is based on `docs/rrms-erd.drawio`. The ER diagram describes table structure, not row data, so this migration creates tables and constraints without inserting sample records.

Run `npm run db:migrate` from the repository root, or `npm run db:migrate` from `backend/`. The runner applies pending migrations in filename order, records them in `public.backend_migrations`, and wraps each migration in a transaction. It refuses to run the initial schema if RRMS tables already exist without migration history, so inspect and reconcile an existing schema before proceeding.

Create each new migration as `backend/migrations/YYYYMMDDHHMMSS_description.sql`, then run the same command. The runner uses the backend `DATABASE_URL` and `DATABASE_CA_CERT` settings.

## Initial administrator

Set `JWT_SECRET` in `backend/.env` to a random string with at least 32 characters. Set `ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, and `ADMIN_SEED_PASSWORD` there as well; use a unique password of at least 12 characters. Keep these values out of source control.

After applying the schema migration, create the initial administrator in Supabase by running this once from the repository root:

```powershell
npm run db:seed-admin
```

The seed command hashes the password before inserting the account into `public.users`, then creates its related row in `public.admins`. It also inserts an example team, resource categories, and resources if they do not already exist. It can be run again safely: it will not reset an existing password or promote an existing non-admin account. Administrators and team members use the same sign-in page at `http://localhost:3000/login`; the account role opens the matching dashboard. The backend stores the session in an HTTP-only cookie.
