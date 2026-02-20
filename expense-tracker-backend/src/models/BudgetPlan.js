import mongoose from "mongoose";

const budgetPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    month: {
      type: String, // Format: "YYYY-MM"
      required: true,
    },
    monthlyIncome: {
      type: Number,
      required: true,
    },
    recommendedSavings: {
      type: Number,
      required: true,
    },
    totalLivingBudget: {
      type: Number,
      required: true,
    },
    needsTotal: {
      type: Number,
      required: true,
    },
    wantsTotal: {
      type: Number,
      required: true,
    },
    needsBreakdown: {
      type: Map,
      of: Number,
      default: {},
    },
    wantsBreakdown: {
      type: Map,
      of: Number,
      default: {},
    },
    note: {
      type: [String],
      default: [],
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Ensure one plan per month per user
budgetPlanSchema.index({ userId: 1, month: 1 }, { unique: true });

export default mongoose.model("BudgetPlan", budgetPlanSchema);
