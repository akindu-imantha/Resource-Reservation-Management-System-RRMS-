import type { SessionUser } from "../../services/auth/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export {};
