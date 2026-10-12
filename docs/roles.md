# User roles

## Team member

- View resources and their availability.
- Create reservations and view their own reservations.
- Cancel their own reservations when the reservation policy allows it.
- Use the calendar to find available time slots.

Frontend pages live under `frontend/src/app/(member)` and member-specific UI lives under `frontend/src/features/team-member`.

## Admin

- Create, edit, deactivate, and view resources.
- View and manage reservations across the organization.
- Use the dashboard to review resource usage and reservation activity.

Admin pages live under `frontend/src/app/admin` and admin-specific UI lives under `frontend/src/features/admin`.

## API access

The backend is organized by domain (`auth`, `resources`, and `reservations`) because both roles use some of the same operations. Role checks belong in backend authorization middleware and must be applied by the API; hiding a page or button in the frontend is not access control.

Suggested policy: team members may read active resources and manage only their own reservations; admins may manage resources and reservations for all users.
