import { Router } from "express";
import { getStats } from "../controllers/dashboardController";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get("/stats", authenticate, authorize("MENTOR"), getStats);

export default router;
