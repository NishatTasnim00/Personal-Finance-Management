import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    spent: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, category: 1, period: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);