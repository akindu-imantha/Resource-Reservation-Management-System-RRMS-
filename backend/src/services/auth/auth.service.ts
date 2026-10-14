import { compare } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import type { RegisterInput } from "../../schemas/auth/auth.schemas.js";
import { asSessionUser, createTeamMemberRecord, findActiveUserRecordByEmail, findActiveUserRecordById, hashPassword, type UserRow } from "../../models/auth/auth.model.js";

const sessionDurationMs = 8 * 60 * 60 * 1000;
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) throw new Error("JWT_SECRET must be set to a random value of at least 32 characters in backend/.env.");

export type AccountRole = "admin" | "team_member";
export type SessionUser = { id: string; name: string; email: string; role: AccountRole; phone: string | null };
export const sessionCookieName = "rrms_session";
export const sessionCookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/api", maxAge: sessionDurationMs });
export const toSessionUser = asSessionUser;
export function createSessionToken(userId: string): string { return sign({ sub: String(userId) }, jwtSecret!, { expiresIn: "8h" }); }
export function readSessionUserId(token: string): string | null {
  try { const payload = verify(token, jwtSecret!) as { sub?: string }; return typeof payload.sub === "string" ? payload.sub : null; }
  catch { return null; }
}
export async function findActiveUserById(id: string): Promise<SessionUser | null> {
  const user = await findActiveUserRecordById(id); return user ? toSessionUser(user) : null;
}
export async function findActiveUserByEmail(email: string): Promise<(UserRow & { password_hash: string }) | null> { return findActiveUserRecordByEmail(email); }
export async function verifyPassword(plainText: string, passwordHash: string): Promise<boolean> { return compare(plainText, passwordHash); }
export async function createTeamMember(input: RegisterInput): Promise<SessionUser> {
  return toSessionUser(await createTeamMemberRecord(input, await hashPassword(input.password)));
}
