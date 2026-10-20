import { Router } from "express";
import authRoutes from "./authRoutes";
import dashboardRoutes from "./dashboardRoutes";
import submissionRoutes from "./submissionRoutes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

router.use("/auth", authRoutes);
router.use("/submissions", submissionRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
