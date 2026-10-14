import { db } from "../../database/pool.js";

export async function listTeamsForUser(userId: string) {
  const result = await db.query(`SELECT t.team_id AS id,t.team_name AS name,t.description,count(tm.member_id)::int AS "memberCount",
    coalesce(bool_or(tm.user_id=$1),false) AS "isMember" FROM public.teams t
    LEFT JOIN public.team_members tm ON tm.team_id=t.team_id GROUP BY t.team_id ORDER BY t.team_name`, [userId]);
  return result.rows;
}
export async function listTeamsForMember(userId: string) {
  const result = await db.query(`SELECT t.team_id AS id,t.team_name AS name,t.description,tm.member_id AS "membershipId"
    FROM public.team_members tm JOIN public.teams t ON t.team_id=tm.team_id WHERE tm.user_id=$1 ORDER BY t.team_name`, [userId]);
  return result.rows;
}
export async function joinTeam(userId: string, teamId: string) {
  const result = await db.query("INSERT INTO public.team_members(user_id,team_id) VALUES($1,$2) RETURNING member_id AS id", [userId,teamId]);
  return result.rows[0] ?? null;
}
export async function leaveTeam(userId: string, membershipId: string): Promise<boolean> {
  const result = await db.query("DELETE FROM public.team_members WHERE member_id=$1 AND user_id=$2", [membershipId,userId]);
  return Boolean(result.rowCount);
}
