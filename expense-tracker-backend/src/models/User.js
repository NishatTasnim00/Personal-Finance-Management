import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, default: "" },
  age: { type: Number, min: 13, max: 120 },
  phone: { type: String, default: "" },
  profession: { type: String },
  currency: { type: String, default: "USD" },
  avatar: { type: String }, // Firebase Storage URL
  monthlyGoal: { type: Number, default: 0 },
  monthlyIncome: { type: Number, default: 0 },
  bio: { type: String, maxlength: 160 },
  notifications: { type: Boolean, default: true },
  theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
