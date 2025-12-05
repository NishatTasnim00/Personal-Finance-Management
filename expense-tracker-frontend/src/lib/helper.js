import { format } from "date-fns";
import {
  Briefcase,
  Laptop2,
  Store,
  TrendingUp,
  Gift,
  Wallet,
  PiggyBank,
  HandCoins,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Receipt,
  HeartPulse,
  GraduationCap,
  Home,
  Coffee,
  Plane,
  Smartphone,
  Dumbbell,
  MoreHorizontal,
} from "lucide-react";

export const defaultIncomeSources = [
  { name: "Salary", value: "salary", icon: Briefcase, color: "#10B981" },
  { name: "Freelance", value: "freelance", icon: Laptop2, color: "#3B82F6" },
  { name: "Business", value: "business", icon: Store, color: "#F59E0B" },
  { name: "Investment", value: "investment", icon: TrendingUp, color: "#8B5CF6" },
  { name: "Gift", value: "gift", icon: Gift, color: "#EC4899" },
  { name: "Bonus", value: "bonus", icon: HandCoins, color: "#FBBF24" },
  { name: "Savings", value: "savings", icon: PiggyBank, color: "#10B981" },
  { name: "Other", value: "other", icon: Wallet, color: "#6B7280" },
];

export const defaultExpenseTypes = [
  { name: "Food & Dining", value: "food", icon: Utensils, color: "#F59E0B" },
  { name: "Transport", value: "transport", icon: Car, color: "#3B82F6" },
  { name: "Shopping", value: "shopping", icon: ShoppingBag, color: "#EC4899" },
  { name: "Entertainment", value: "entertainment", icon: Gamepad2, color: "#8B5CF6" },
  { name: "Bills & Utilities", value: "bills", icon: Receipt, color: "#EF4444" },
  { name: "Healthcare", value: "health", icon: HeartPulse, color: "#10B981" },
  { name: "Education", value: "education", icon: GraduationCap, color: "#6366F1" },
  { name: "Rent/Mortgage", value: "rent", icon: Home, color: "#F97316" },
  { name: "Groceries", value: "groceries", icon: Coffee, color: "#D97706" },
  { name: "Travel", value: "travel", icon: Plane, color: "#06B6D4" },
  { name: "Phone & Internet", value: "phone", icon: Smartphone, color: "#8B5CF6" },
  { name: "Fitness", value: "fitness", icon: Dumbbell, color: "#EC4899" },
  { name: "Other", value: "other", icon: MoreHorizontal, color: "#6B7280" },
];

export const recurringOption = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "halfyearly", label: "Half Yearly" },
  { value: "yearly", label: "Yearly" },
];

export const formatDate = (date) => {
  if (!date) return "N/A";
  return format(new Date(date), "MMM d, yyyy");
};