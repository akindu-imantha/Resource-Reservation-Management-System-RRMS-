import { db } from "../../database/pool.js";

export async function updateProfile(userId: string, name: string, phone: string | null) {
  const result = await db.query(`UPDATE public.users SET full_name=$1,phone=$2 WHERE user_id=$3
    RETURNING user_id AS id,full_name AS name,email,phone,role`, [name,phone,userId]);
  return result.rows[0] ?? null;
}
