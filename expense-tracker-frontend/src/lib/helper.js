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
} from "lucide-react";

export const defaultIncomeSources = [
  { name: "Salary",     value: "salary",     icon: Briefcase,    color: "#10B981" },
  { name: "Freelance",  value: "freelance",  icon: Laptop2,      color: "#3B82F6" },
  { name: "Business",   value: "business",   icon: Store,        color: "#F59E0B" },
  { name: "Investment", value: "investment", icon: TrendingUp,   color: "#8B5CF6" },
  { name: "Gift",       value: "gift",       icon: Gift,         color: "#EC4899" },
  { name: "Bonus",      value: "bonus",      icon: HandCoins,    color: "#FBBF24" },
  { name: "Savings",    value: "savings",    icon: PiggyBank,    color: "#10B981" },
  { name: "Other",      value: "other",      icon: Wallet,       color: "#6B7280" },
];

export const formatDate = (date) => {
    if (!date) return "N/A";
    return format(new Date(date), "MMM d, yyyy");
  };