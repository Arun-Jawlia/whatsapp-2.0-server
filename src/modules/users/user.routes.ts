import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { usersController } from "./user.controllers";

const router = Router();

router.patch("/location", requireAuth, usersController.updateLocation);
router.get("/search", requireAuth, usersController.searchUsers);
router.get("/nearby", requireAuth, usersController.nearbyUsers);
router.post("/backup-key", requireAuth, usersController.saveEncryptedKey);
router.get("/backup-key", requireAuth, usersController.getEncryptedKey);
router.patch("/update-publickey", requireAuth, usersController.updatePublickey);

export default router;
