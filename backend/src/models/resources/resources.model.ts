import { db } from "../../database/pool.js";

export async function listVisibleResources(role: string) {
  const result = await db.query(`SELECT r.resource_id AS id,r.name,r.description,r.capacity,r.location,r.type,
      r.availability_status AS status,c.category_name AS category
    FROM public.resources r LEFT JOIN public.resource_categories c ON c.category_id=r.category_id
    WHERE $1='admin' OR r.availability_status='available' ORDER BY r.name`, [role]);
  return result.rows;
}
