import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { aiController } from "./ai.controllers";

const router = Router();

// router.post("/send", requireAuth, aiController.send);
router.post("/send", aiController.send);

export default router;