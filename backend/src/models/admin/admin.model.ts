import { db } from "../../database/pool.js";

export async function getDashboardData() {
  const [resources, metrics] = await Promise.all([
    db.query<{ resource_id: string; name: string; type: string; location: string | null; availability_status: string; category_name: string | null }>(
      `SELECT r.resource_id,r.name,r.type,r.location,r.availability_status,c.category_name
       FROM public.resources r LEFT JOIN public.resource_categories c ON c.category_id=r.category_id ORDER BY r.name`),
    db.query<{ resource_count: string; team_count: string; member_count: string; reservation_count: string; pending_count: string }>(
      `SELECT (SELECT count(*) FROM public.resources)::text AS resource_count,
       (SELECT count(*) FROM public.teams)::text AS team_count,
       (SELECT count(*) FROM public.users WHERE role='team_member' AND account_status='active')::text AS member_count,
       (SELECT count(*) FROM public.reservations)::text AS reservation_count,
       (SELECT count(*) FROM public.reservations WHERE status='pending')::text AS pending_count`),
  ]);
  return { resources: resources.rows, counts: metrics.rows[0] };
}
