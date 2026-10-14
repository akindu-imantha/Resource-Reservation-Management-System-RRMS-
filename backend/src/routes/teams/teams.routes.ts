import { Router } from "express";
import { list, mine, join, leave } from "../../controllers/teams/teams.controller.js";
import { authenticate } from "../../middleware/auth/authenticate.js";
import { authorizeRoles } from "../../middleware/auth/authorize-roles.js";

const router = Router();
router.use(authenticate);
router.get("/", list);
router.get("/mine", authorizeRoles("team_member"), mine);
router.post("/:id/join", authorizeRoles("team_member"), join);
router.delete("/memberships/:id", authorizeRoles("team_member"), leave);
export default router;
