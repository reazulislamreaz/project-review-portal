import { Router } from "express";
import {
  createSubmission,
  getMySubmission,
  listSubmissions,
  updateSubmissionStatus,
} from "../controllers/submissionController";
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

// Student-owned submission — register before any /:id routes.
router.get("/me", authenticate, authorize("STUDENT"), getMySubmission);

router.get("/", authenticate, authorize("MENTOR"), listSubmissions);

router.patch(
  "/:id/status",
  authenticate,
  authorize("MENTOR"),
  updateSubmissionStatus,
);

export default router;
