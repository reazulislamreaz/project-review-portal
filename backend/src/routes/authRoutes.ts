import { Router } from "express";
import { login, me, signup, updateProfile } from "../controllers/authController";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, updateProfile);

/**
 * Minimal mentor-only endpoint for verifying RBAC in B3.
 * Not part of the product API surface for submissions or review.
 */
router.get("/mentor-check", authenticate, authorize("MENTOR"), (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Mentor access granted",
  });
});

export default router;
