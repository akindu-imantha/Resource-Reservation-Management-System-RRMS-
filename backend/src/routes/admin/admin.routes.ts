import { Router } from "express";
import { authenticate } from "../../middleware/auth/authenticate.js";
import { authorizeRoles } from "../../middleware/auth/authorize-roles.js";
import { overview } from "../../controllers/admin/admin.controller.js";

const router = Router();
router.use(authenticate, authorizeRoles("admin"));
router.get("/overview", overview);
export default router;
