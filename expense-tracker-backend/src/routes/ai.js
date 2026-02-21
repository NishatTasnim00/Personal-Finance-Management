import express from "express";
import {
  generateBudgetPlan,
  getStoredBudgetPlan,
  acceptBudgetPlan,
} from "../controllers/aiController.js";
import { verifyFirebaseToken as protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/generate-plan", protect, generateBudgetPlan);
router.get("/plan", protect, getStoredBudgetPlan);
router.post("/accept-plan", protect, acceptBudgetPlan);

export default router;
