import type { RequestHandler } from "express";
import type { AccountRole } from "../../services/auth/auth.service.js";

export function authorizeRoles(...allowedRoles: AccountRole[]): RequestHandler {
  return (request, response, next) => {
    if (!request.user) {
      response.status(401).json({ error: "Sign-in required." });
      return;
    }
    if (!allowedRoles.includes(request.user.role)) {
      response.status(403).json({ error: "You do not have access to this workspace." });
      return;
    }
    next();
  };
}
