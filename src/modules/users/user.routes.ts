import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { usersController } from "./user.controllers";

const router = Router();

router.patch("/location", requireAuth, usersController.updateLocation);
router.get("/search", requireAuth, usersController.searchUsers);
router.get("/nearby", requireAuth, usersController.nearbyUsers);

export default router;
