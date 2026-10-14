import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate } from "../../middleware/auth/authenticate.js";
import { currentUser, login, logout, register } from "../../controllers/auth/auth.controller.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please try again in 15 minutes." },
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many account attempts. Please try again later." },
});

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/me", authenticate, currentUser);
router.post("/logout", logout);

export default router;
