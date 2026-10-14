import { db } from "../../database/pool.js";

export class ReservationModelError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export async function listReservationsForUser(userId: string) {
  const result = await db.query(`SELECT b.reservation_id AS id,b.start_time AS "startTime",b.end_time AS "endTime",b.purpose,b.status,
    r.name AS "resourceName",t.team_name AS "teamName" FROM public.reservations b
    JOIN public.resources r ON r.resource_id=b.resource_id LEFT JOIN public.teams t ON t.team_id=b.team_id
    WHERE b.user_id=$1 ORDER BY b.start_time DESC`, [userId]);
  return result.rows;
}

export async function createReservation(userId: string, input: { resourceId: number; teamId?: number | null; startTime: string; endTime: string; purpose: string }) {
  const client = await db.connect();
  let transaction = false;
  try {
    await client.query("BEGIN"); transaction = true;
    await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [input.resourceId]);
    const resource = await client.query("SELECT 1 FROM public.resources WHERE resource_id=$1 AND availability_status='available'", [input.resourceId]);
    if (!resource.rowCount) throw new ReservationModelError(409,"That resource is not currently available.");
    if (input.teamId) {
      const membership = await client.query("SELECT 1 FROM public.team_members WHERE user_id=$1 AND team_id=$2", [userId,input.teamId]);
      if (!membership.rowCount) throw new ReservationModelError(403,"Join that team before booking for it.");
    }
    const conflict = await client.query(`SELECT 1 FROM public.reservations WHERE resource_id=$1
      AND status IN ('pending','approved') AND start_time < $3 AND end_time > $2 LIMIT 1`, [input.resourceId,input.startTime,input.endTime]);
    if (conflict.rowCount) throw new ReservationModelError(409,"That resource already has a reservation during this time.");
    const result = await client.query(`INSERT INTO public.reservations(resource_id,user_id,team_id,start_time,end_time,purpose)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING reservation_id AS id,status,start_time AS "startTime",end_time AS "endTime",purpose`,
      [input.resourceId,userId,input.teamId ?? null,input.startTime,input.endTime,input.purpose]);
    await client.query("COMMIT"); transaction = false;
    return result.rows[0];
  } catch (error) {
    if (transaction) await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function cancelReservation(userId: string, reservationId: string) {
  const result = await db.query(`UPDATE public.reservations SET status='cancelled'
    WHERE reservation_id=$1 AND user_id=$2 AND status='pending' RETURNING reservation_id AS id,status`, [reservationId,userId]);
  return result.rows[0] ?? null;
}
