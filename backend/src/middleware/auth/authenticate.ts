import type { NextFunction, Request, Response } from "express";
import { adminSessionDurationMs, findActiveUserById, readSessionIssuedAt, readSessionUserId, sessionCookieBaseOptions, sessionCookieName } from "../../services/auth/auth.service.js";

export async function authenticate(request: Request, response: Response, next: NextFunction): Promise<void> {
  const token = request.cookies?.[sessionCookieName];
  if (typeof token !== "string") {
    response.status(401).json({ error: "Sign-in required." });
    return;
  }

  const userId = readSessionUserId(token);
  const issuedAt = readSessionIssuedAt(token);
  if (!userId || issuedAt === null) {
    response.clearCookie(sessionCookieName, sessionCookieBaseOptions());
    response.status(401).json({ error: "Your session has expired. Please sign in again." });
    return;
  }

  try {
    const user = await findActiveUserById(userId);
    if (!user) {
      response.clearCookie(sessionCookieName, sessionCookieBaseOptions());
      response.status(401).json({ error: "This account is inactive or unavailable." });
      return;
    }
    if (user.role === "admin" && Date.now() >= issuedAt * 1000 + adminSessionDurationMs) {
      response.clearCookie(sessionCookieName, sessionCookieBaseOptions());
      response.status(401).json({ error: "Your admin session has expired. Please sign in again." });
      return;
    }
    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}