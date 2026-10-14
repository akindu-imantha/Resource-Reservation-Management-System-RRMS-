import { Router } from "express";
import { list } from "../../controllers/resources/resources.controller.js";
import { authenticate } from "../../middleware/auth/authenticate.js";

const router = Router();
router.use(authenticate);
router.get("/", list);
export default router;
