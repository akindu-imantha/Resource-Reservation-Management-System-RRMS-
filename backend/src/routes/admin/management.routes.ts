import { Router } from "express";
import { authenticate } from "../../middleware/auth/authenticate.js";
import { authorizeRoles } from "../../middleware/auth/authorize-roles.js";
import * as controller from "../../controllers/admin/management.controller.js";

const router = Router();
router.use(authenticate, authorizeRoles("admin"));

router.get("/resources", controller.getResources);
router.post("/resources", controller.createResource);
router.patch("/resources/:id", controller.editResource);
router.delete("/resources/:id", controller.removeResource);

router.get("/categories", controller.getCategories);
router.post("/categories", controller.createCategory);
router.patch("/categories/:id", controller.editCategory);
router.delete("/categories/:id", controller.removeCategory);

router.get("/teams", controller.getTeams);
router.post("/teams", controller.createTeam);
router.patch("/teams/:id", controller.editTeam);
router.delete("/teams/:id", controller.removeTeam);

router.get("/members", controller.getMembers);
router.post("/memberships", controller.createMembership);
router.delete("/memberships/:id", controller.removeMembership);

router.get("/reservations", controller.getReservations);
router.patch("/reservations/:id", controller.editReservation);

export default router;
