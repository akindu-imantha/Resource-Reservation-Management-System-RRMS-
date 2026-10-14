import { Router } from "express";
import { update } from "../../controllers/profile/profile.controller.js";
import { authenticate } from "../../middleware/auth/authenticate.js";

const router = Router();
router.use(authenticate);
router.patch("/", update);
export default router;
