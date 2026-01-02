import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  icon: { type: String, default: 'Target' },
  color: { type: String, default: '#10b981' },
  recurring: { type: Boolean, default: false },
  recurringAmount: { type: Number, default: 0 },
  recurringFrequency: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  lastContributed: { type: Date },
}, { timestamps: true });

savingsGoalSchema.virtual('progress').get(function () {
  return this.targetAmount > 0 ? (this.currentAmount / this.targetAmount) * 100 : 0;
});

export default mongoose.model('SavingsGoal', savingsGoalSchema);