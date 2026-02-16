import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { friendsController } from "./friends.controllers";

const router = Router();

router.post("/request/send", requireAuth, friendsController.sendRequest);

router.post("/request/accept", requireAuth, friendsController.acceptRequest);
router.post("/request/reject", requireAuth, friendsController.rejectRequest);
router.post("/request/cancel", requireAuth, friendsController.cancelRequest);

router.get("/requests/incoming", requireAuth, friendsController.incoming);
router.get("/requests/outgoing", requireAuth, friendsController.outgoing);

router.get("/list", requireAuth, friendsController.friends);

export default router;
