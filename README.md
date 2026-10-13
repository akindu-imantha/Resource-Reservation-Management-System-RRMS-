# Resource Reservation Management System

Next.js and TypeScript frontend with a separate TypeScript API backend.

## Project layout

- `frontend/` — App Router pages, shared UI, and separate team member/admin features.
- `backend/` — API grouped by auth, resources, and reservations; authorization is enforced by the API.
- `docs/rrms-erd.drawio` — current ER diagram.
- `docs/roles.md` — role responsibilities and access rules.

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
