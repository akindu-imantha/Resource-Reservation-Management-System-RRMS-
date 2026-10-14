import { Router } from "express";
import { cancel, create, list } from "../../controllers/reservations/reservations.controller.js";
import { authenticate } from "../../middleware/auth/authenticate.js";
import { authorizeRoles } from "../../middleware/auth/authorize-roles.js";

const router = Router();
router.use(authenticate, authorizeRoles("team_member"));
router.get("/", list);
router.post("/", create);
router.patch("/:id/cancel", cancel);
export default router;
