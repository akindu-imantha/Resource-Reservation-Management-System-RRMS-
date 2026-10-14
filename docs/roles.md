# User roles

## Team member

- View active resources and their listed details.
- Create reservations for available time slots and view their own reservations.
- Cancel their own pending reservations.
- View and manage their team memberships and profile.

Member routes live under `frontend/src/pages/member`; the shared member interface is in `frontend/src/components/member/MemberConsole.tsx`.

## Admin

- Create and edit resources and categories.
- View and manage reservations across the organization.
- Manage teams and member access.
- Review reservation activity on the dashboard.

Admin routes live under `frontend/src/pages/admin`; the shared admin interface is in `frontend/src/components/admin/AdminConsole.tsx`.

## API access

The backend is organized by domain because both roles use some of the same operations. Role checks are applied by backend authorization middleware; hiding a page or button in the frontend is not access control.

Reservation creation checks that the resource is available, checks team membership when booking for a team, and rejects overlapping pending or approved reservations.