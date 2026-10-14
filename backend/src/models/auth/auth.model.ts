import { hash } from "bcryptjs";
import { db } from "../../database/pool.js";
import type { RegisterInput } from "../../schemas/auth/auth.schemas.js";
import type { AccountRole, SessionUser } from "../../services/auth/auth.service.js";

export type UserRow = { user_id: string; full_name: string; email: string; role: AccountRole; phone: string | null };
export type LoginUserRow = UserRow & { password_hash: string };

export async function findActiveUserRecordById(id: string): Promise<UserRow | null> {
  const result = await db.query<UserRow>(`SELECT user_id,full_name,email,role,phone FROM public.users
    WHERE user_id=$1 AND account_status='active' LIMIT 1`, [id]);
  const user = result.rows[0];
  if (!user) return null;
  if (user.role === "admin") {
    const admin = await db.query("SELECT 1 FROM public.admins WHERE user_id=$1", [user.user_id]);
    if (!admin.rowCount) return null;
  }
  return user;
}

export async function findActiveUserRecordByEmail(email: string): Promise<LoginUserRow | null> {
  const result = await db.query<LoginUserRow>(`SELECT user_id,full_name,email,password_hash,role,phone FROM public.users
    WHERE lower(email)=lower($1) AND account_status='active' LIMIT 1`, [email]);
  return result.rows[0] ?? null;
}

export async function hasAdminRecord(userId: string): Promise<boolean> {
  const result = await db.query("SELECT 1 FROM public.admins WHERE user_id=$1", [userId]);
  return Boolean(result.rowCount);
}

export async function createTeamMemberRecord(input: RegisterInput, passwordHash: string): Promise<UserRow> {
  const result = await db.query<UserRow>(`INSERT INTO public.users (full_name,email,password_hash,role)
    VALUES ($1,lower($2),$3,'team_member') RETURNING user_id,full_name,email,role,phone`, [input.name,input.email,passwordHash]);
  if (!result.rows[0]) throw new Error("Database did not return the new user.");
  return result.rows[0];
}

export async function hashPassword(password: string): Promise<string> { return hash(password, 12); }

export function asSessionUser(user: UserRow): SessionUser {
  return { id: user.user_id, name: user.full_name, email: user.email, role: user.role, phone: user.phone };
}
