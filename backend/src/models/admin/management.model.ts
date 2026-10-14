import { db } from "../../database/pool.js";

export type ResourceInput = { name: string; description?: string | null; categoryId?: number | null; capacity: number; location?: string | null; type: string; status?: "available" | "unavailable" | "maintenance" };
export type NamedInput = { name: string; description?: string | null };

export async function listResources() {
  const result = await db.query(`SELECT r.resource_id AS id,r.name,r.description,r.capacity,r.location,r.type,
    r.availability_status AS status,r.category_id AS "categoryId",c.category_name AS category
    FROM public.resources r LEFT JOIN public.resource_categories c ON c.category_id=r.category_id ORDER BY r.name`);
  return result.rows;
}
export async function createResource(item: ResourceInput) {
  const result = await db.query(`INSERT INTO public.resources(name,description,category_id,capacity,location,type,availability_status)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING resource_id AS id,name,description,capacity,location,type,availability_status AS status,category_id AS "categoryId"`,
  [item.name,item.description ?? null,item.categoryId ?? null,item.capacity,item.location ?? null,item.type,item.status ?? "available"]);
  return result.rows[0];
}
export async function updateResource(id: string, item: Partial<ResourceInput>) {
  const oldResult = await db.query<Record<string, unknown>>("SELECT * FROM public.resources WHERE resource_id=$1", [id]);
  const old = oldResult.rows[0];
  if (!old) return null;
  const result = await db.query(`UPDATE public.resources SET name=$1,description=$2,category_id=$3,capacity=$4,location=$5,type=$6,availability_status=$7
    WHERE resource_id=$8 RETURNING resource_id AS id,name,description,capacity,location,type,availability_status AS status,category_id AS "categoryId"`,
  [item.name ?? old.name,item.description === undefined ? old.description : item.description,item.categoryId === undefined ? old.category_id : item.categoryId,
    item.capacity ?? old.capacity,item.location === undefined ? old.location : item.location,item.type ?? old.type,item.status ?? old.availability_status,id]);
  return result.rows[0] ?? null;
}
export async function deleteResource(id: string): Promise<boolean> {
  const result = await db.query("DELETE FROM public.resources WHERE resource_id=$1", [id]);
  return Boolean(result.rowCount);
}

export async function listCategories() {
  const result = await db.query("SELECT category_id AS id,category_name AS name,description FROM public.resource_categories ORDER BY category_name");
  return result.rows;
}
export async function createCategory(item: NamedInput) {
  const result = await db.query("INSERT INTO public.resource_categories(category_name,description) VALUES($1,$2) RETURNING category_id AS id,category_name AS name,description", [item.name,item.description ?? null]);
  return result.rows[0];
}
export async function updateCategory(id: string, item: Partial<NamedInput>) {
  const result = await db.query(`UPDATE public.resource_categories SET category_name=coalesce($1,category_name),
    description=CASE WHEN $2 THEN $3 ELSE description END WHERE category_id=$4
    RETURNING category_id AS id,category_name AS name,description`, [item.name ?? null,item.description !== undefined,item.description ?? null,id]);
  return result.rows[0] ?? null;
}
export async function deleteCategory(id: string): Promise<boolean> {
  const result = await db.query("DELETE FROM public.resource_categories WHERE category_id=$1", [id]);
  return Boolean(result.rowCount);
}

export async function listTeams() {
  const result = await db.query(`SELECT t.team_id AS id,t.team_name AS name,t.description,t.created_at AS "createdAt",count(tm.member_id)::int AS "memberCount"
    FROM public.teams t LEFT JOIN public.team_members tm ON tm.team_id=t.team_id GROUP BY t.team_id ORDER BY t.team_name`);
  return result.rows;
}
export async function createTeam(item: NamedInput) {
  const result = await db.query(`INSERT INTO public.teams(team_name,description) VALUES($1,$2)
    RETURNING team_id AS id,team_name AS name,description,created_at AS "createdAt"`, [item.name,item.description ?? null]);
  return result.rows[0];
}
export async function updateTeam(id: string, item: Partial<NamedInput>) {
  const result = await db.query(`UPDATE public.teams SET team_name=coalesce($1,team_name),
    description=CASE WHEN $2 THEN $3 ELSE description END WHERE team_id=$4
    RETURNING team_id AS id,team_name AS name,description,created_at AS "createdAt"`, [item.name ?? null,item.description !== undefined,item.description ?? null,id]);
  return result.rows[0] ?? null;
}
export async function deleteTeam(id: string): Promise<boolean> {
  const result = await db.query("DELETE FROM public.teams WHERE team_id=$1", [id]);
  return Boolean(result.rowCount);
}

export async function listMembers() {
  const result = await db.query(`SELECT u.user_id AS id,u.full_name AS name,u.email,u.phone,u.account_status AS status,u.role,
    coalesce(json_agg(json_build_object('id',t.team_id,'name',t.team_name,'membershipId',tm.member_id)) FILTER (WHERE t.team_id IS NOT NULL),'[]') AS teams
    FROM public.users u LEFT JOIN public.team_members tm ON tm.user_id=u.user_id LEFT JOIN public.teams t ON t.team_id=tm.team_id
    WHERE u.role='team_member' GROUP BY u.user_id ORDER BY u.full_name`);
  return result.rows;
}
export async function addMembership(userId: number, teamId: number) {
  const result = await db.query(`INSERT INTO public.team_members(user_id,team_id) SELECT $1,$2
    WHERE EXISTS(SELECT 1 FROM public.users WHERE user_id=$1 AND role='team_member') RETURNING member_id AS id`, [userId,teamId]);
  return result.rows[0] ?? null;
}
export async function removeMembership(id: string): Promise<boolean> {
  const result = await db.query("DELETE FROM public.team_members WHERE member_id=$1", [id]);
  return Boolean(result.rowCount);
}

export async function listReservations() {
  const result = await db.query(`SELECT b.reservation_id AS id,b.start_time AS "startTime",b.end_time AS "endTime",b.purpose,b.status,
    u.full_name AS "userName",u.email,r.name AS "resourceName",t.team_name AS "teamName"
    FROM public.reservations b JOIN public.users u ON u.user_id=b.user_id JOIN public.resources r ON r.resource_id=b.resource_id
    LEFT JOIN public.teams t ON t.team_id=b.team_id ORDER BY b.start_time DESC`);
  return result.rows;
}
export async function updateReservation(id: string, status: "approved" | "rejected" | "cancelled" | "completed") {
  const result = await db.query(`WITH current AS (
      SELECT reservation_id,status AS "previousStatus" FROM public.reservations WHERE reservation_id=$2 FOR UPDATE
    ), updated AS (
      UPDATE public.reservations b SET status=$1 FROM current c WHERE b.reservation_id=c.reservation_id
      RETURNING b.reservation_id AS id,b.status,c."previousStatus"
    ) SELECT id,status,"previousStatus" FROM updated`, [status,id]);
  return result.rows[0] ?? null;
}
