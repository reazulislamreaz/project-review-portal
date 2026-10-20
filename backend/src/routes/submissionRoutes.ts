import { Router } from "express";
import { createSubmission } from "../controllers/submissionController";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { submissionRateLimit } from "../middlewares/submissionRateLimit";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize("STUDENT"),
  submissionRateLimit,
  createSubmission,
);

export default router;
