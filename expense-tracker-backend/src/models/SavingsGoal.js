import mongoose from "mongoose";

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return value > new Date();
        },
        message: "Deadline must be in the future",
      },
    },
    icon: {
      type: String,
      default: "🎯",
      maxlength: 10,
    },
    color: {
      type: String,
      default: "#10b981",
      match: [/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"],
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    recurringAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    recurringFrequency: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      default: "monthly",
    },
    lastContributed: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

savingsGoalSchema.virtual("progress").get(function () {
  if (this.targetAmount <= 0) return 0;
  return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
});

savingsGoalSchema.pre("save", function (next) {
  if (this.recurring === false) {
    this.recurringAmount = 0;
    this.lastContributed = null;
  }
  next();
});

export default mongoose.model("SavingsGoal", savingsGoalSchema);
