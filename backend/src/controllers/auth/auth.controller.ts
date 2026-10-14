import type { Request, Response } from "express";
import { hasAdminRecord } from "../../models/auth/auth.model.js";
import { createSessionToken, createTeamMember, findActiveUserByEmail, sessionCookieName, sessionCookieOptions, toSessionUser, verifyPassword } from "../../services/auth/auth.service.js";
import { loginSchema, registerSchema } from "../../schemas/auth/auth.schemas.js";

function sendSession(response: Response, user: ReturnType<typeof toSessionUser>): void {
  response.cookie(sessionCookieName, createSessionToken(user.id), sessionCookieOptions());
  response.json({ user });
}

export async function register(request: Request, response: Response): Promise<void> {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Enter your name, a valid email, and a password with at least 12 characters." });
    return;
  }
  try {
    const user = await createTeamMember(parsed.data);
    sendSession(response, user);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      response.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    console.error("Account registration failed:", error);
    response.status(500).json({ error: "Could not create your account right now. Please try again." });
  }
}

export async function login(request: Request, response: Response): Promise<void> {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Enter a valid email and password." });
    return;
  }
  try {
    const account = await findActiveUserByEmail(parsed.data.email);
    if (!account || !(await verifyPassword(parsed.data.password, account.password_hash))) {
      response.status(401).json({ error: "Email or password is incorrect." });
      return;
    }
    if (account.role === "admin") {
      const isAdmin = await hasAdminRecord(account.user_id);
      if (!isAdmin) {
        response.status(401).json({ error: "Email or password is incorrect." });
        return;
      }
    }
    sendSession(response, toSessionUser(account));
  } catch (error) {
    console.error("Sign-in failed:", error);
    response.status(500).json({ error: "Could not sign in right now. Please try again." });
  }
}

export function currentUser(request: Request, response: Response): void {
  if (!request.user) {
    response.status(401).json({ error: "Sign-in required." });
    return;
  }
  response.json({ user: request.user });
}

export function logout(_request: Request, response: Response): void {
  response.clearCookie(sessionCookieName, sessionCookieOptions());
  response.status(204).end();
}
