# Resource Reservation Management System

Next.js and TypeScript frontend with a separate TypeScript API backend.

## Project layout

- `frontend/` — App Router pages, shared UI, and separate team member/admin features.
- `backend/` — API grouped by auth, resources, and reservations; authorization is enforced by the API.
- `docs/rrms-erd.drawio` — current ER diagram.
- `docs/roles.md` — role responsibilities and access rules.

## Local setup

1. Install Node.js and PostgreSQL.
2. Copy `.env.example` to `backend/.env` and set `DATABASE_URL` to your local PostgreSQL credentials.
3. Copy `frontend/.env.example` to `frontend/.env.local`.
4. Run `npm install` from the repository root.
5. Start the API with `npm run dev:backend` and the frontend with `npm run dev:frontend` in separate terminals.

The database schema and migrations will be added after the reservation and resource details are finalized.
