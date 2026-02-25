import express from "express";
import {
  generateBudgetPlan,
  getStoredBudgetPlan,
  acceptBudgetPlan,
  deleteBudgetPlan,
} from "../controllers/aiController.js";
import { verifyFirebaseToken as protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/generate-plan", protect, generateBudgetPlan);
router.get("/plan", protect, getStoredBudgetPlan);
router.post("/accept-plan", protect, acceptBudgetPlan);
router.delete("/plan", protect, deleteBudgetPlan);

export default router;
