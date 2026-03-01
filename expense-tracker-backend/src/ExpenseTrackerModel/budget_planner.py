"""
budget_planner.py
Core budget intelligence. Uses keyword-based categorization (no Ollama needed)
and SARIMA/linear regression to predict next month's spending per category.

Allocation logic:
  1. Fixed needs (Rent, EMI) → full historical amount first
  2. Remaining → split between variable needs and wants
     - No custom budget: 50/30/20 rule (needs 62.5%, wants 37.5% of spending cap)
     - Custom budget:    60% needs, 40% wants of spending cap
  3. Hard cap ensures total never exceeds spending_cap
"""

import pandas as pd
import numpy as np
from models.linear_trend import MonthlyTrendRegressor
from models.sarima_trend import MonthlySARIMATrendRegressor


# ── Keyword-based categorizer ─────────────────────────────────────────────────
class KeywordCategorizer:
    """
    Maps app category values (rent, food, bills...) to standardized labels
    that match mandatory_labels and wants_labels in BudgetAI.
    Falls back to keyword matching on description text.
    """

    # App DB value → standardized label
    CATEGORY_MAP = {
        "rent":          "House Rent",
        "bills":         "Utilities",
        "phone":         "Utilities",
        "groceries":     "Groceries",
        "health":        "Healthcare",
        "education":     "Education",
        "transport":     "Transportation",
        "food":          "Dining Out",
        "entertainment": "Entertainment",
        "shopping":      "Shopping",
        "travel":        "Travel",
        "fitness":       "Health and Fitness",
        "other":         "Miscellaneous",
    }

    # Keyword fallback: (keywords, label)
    KEYWORD_MAP = [
        (["rent", "house", "flat", "bari", "basa", "apartment", "mortgage", "emi", "loan", "installment"], "House Rent"),
        (["groceries", "grocery", "bazar", "shwapno", "meena", "supermarket", "vegetable", "rice", "fish", "meat"], "Groceries"),
        (["electricity", "wasa", "water", "gas", "internet", "wifi", "broadband", "utility", "utilities", "bill", "bills"], "Utilities"),
        (["phone", "mobile", "recharge", "airtel", "robi", "grameenphone", "gp", "banglalink"], "Utilities"),
        (["school", "college", "university", "tuition", "tution", "coach", "education", "books"], "Education"),
        (["doctor", "hospital", "pharmacy", "medicine", "clinic", "health", "labaid"], "Healthcare"),
        (["bus", "train", "cng", "rickshaw", "uber", "pathao", "fuel", "petrol", "metro", "transport"], "Transportation"),
        (["restaurant", "dining", "cafe", "coffee", "foodpanda", "shohoz", "fast food", "kfc", "pizza"], "Dining Out"),
        (["netflix", "spotify", "youtube", "movie", "cinema", "game", "pubg", "entertainment", "subscription"], "Entertainment"),
        (["daraz", "clothing", "fashion", "shoes", "bag", "accessories", "shopping"], "Shopping"),
        (["travel", "hotel", "flight", "trip", "vacation", "tour"], "Travel"),
        (["gym", "fitness", "yoga", "sport", "workout"], "Health and Fitness"),
    ]

    def predict(self, category: str, description: str = "") -> str:
        # 1. Direct category value match (most reliable - app stores clean values)
        if category:
            clean = str(category).strip().lower()
            if clean in self.CATEGORY_MAP:
                return self.CATEGORY_MAP[clean]

        # 2. Keyword match on combined category + description text
        text = f"{category} {description}".lower()
        for keywords, label in self.KEYWORD_MAP:
            if any(kw in text for kw in keywords):
                return label

        return "Miscellaneous"


# ── BudgetAI ──────────────────────────────────────────────────────────────────
class BudgetAI:

    # Categories that are non-negotiable (never scale down below historical)
    FIXED_CATEGORIES = {"House Rent", "EMI/Loan/Insurance", "Rent"}

    NEEDS_LABELS = {
        "House Rent", "Rent", "Utilities", "Groceries",
        "EMI/Loan/Insurance", "Debt", "Transportation",
        "Loan EMI", "Education", "Health and Fitness",
        "Utility", "Healthcare", "Bills",
    }

    WANTS_LABELS = {
        "Dining Out", "Shopping", "Subscriptions", "Entertainment",
        "Food Delivery", "Personal Care", "Gifts", "Clothing",
        "Food & Drinks", "Travel", "Movies", "Coffee",
        "Miscellaneous",  # catch-all → wants, not needs
    }

    def __init__(self):
        self.categorizer = KeywordCategorizer()

    # ── Trend prediction ──────────────────────────────────────────────────────
    def _predict_category_trend(self, cat_data: pd.DataFrame, category_name: str = None) -> int:
        """
        Predicts next month's spend for one category.
        - Fixed categories (rent/EMI): use max of last 4 months (stable, no regression)
        - ≤5 months data: simple mean × 1.05
        - >5 months: SARIMA → fallback to recent mean if SARIMA fails
        """
        if cat_data.empty:
            return 0

        monthly = (
            cat_data
            .groupby(cat_data["date"].dt.tz_localize(None).dt.to_period("M"))["amount"]
            .sum()
            .sort_index()
        )
        values = monthly[monthly > 0].values

        if len(values) == 0:
            return 0

        # Fixed costs: trust the recent high, no regression needed
        if category_name in self.FIXED_CATEGORIES:
            return round(float(np.max(values[-4:])))

        # Too few data points for SARIMA
        if len(values) <= 5:
            return round(float(np.mean(values)) * 1.05)

        # Try SARIMA
        try:
            reg = MonthlySARIMATrendRegressor(
                seasonal_period=12,
                max_pdq=3,
                max_PDQ=2,
                stepwise=True,
            ).fit(values)

            if reg.is_fitted:
                pred = reg.predict_next()
                hist_max = float(values.max())
                pred = min(pred, hist_max * 1.25)   # cap: max 25% above historical max
                pred = max(pred, hist_max * 0.65)   # floor: min 65% of historical max
                return round(pred * 1.05)           # small optimism buffer

            # SARIMA not fitted → fallback
            return round(float(np.mean(values[-6:])) * 1.07)

        except Exception as e:
            print(f"SARIMA failed for {category_name}: {e}", file=__import__("sys").stderr)
            return round(float(np.mean(values[-6:])) * 1.07)

    # ── Filter to expenses only ───────────────────────────────────────────────
    def _filter_expenses(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        col_map = {c.lower(): c for c in df.columns}
        if "type" in col_map:
            type_col = col_map["type"]
            df = df[df[type_col].astype(str).str.lower().str.strip() != "income"]
        df["amount"] = df["amount"].abs()
        return df

    # ── Per-category spend predictions ───────────────────────────────────────
    def predict_next_month_budget(self, transaction_history: list) -> dict:
        """
        Returns predicted spend per labeled category for next month.
        """
        df = pd.DataFrame(transaction_history)
        if df.empty:
            return {"breakdown": {}, "total_predicted": 0}

        df["date"] = pd.to_datetime(df["date"], errors="coerce", utc=True)
        df = df.dropna(subset=["date", "amount", "category"])
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
        df = self._filter_expenses(df)

        if df.empty:
            return {"breakdown": {}, "total_predicted": 0}

        df["label"] = df.apply(
            lambda row: self.categorizer.predict(
                row.get("category", ""),
                row.get("description", "")
            ),
            axis=1,
        )

        predictions = {}
        for label in df["label"].unique():
            if not label:
                continue
            cat_data = df[df["label"] == label]
            pred = self._predict_category_trend(cat_data, category_name=label)
            if pred > 0:
                predictions[label] = pred

        return {"breakdown": predictions, "total_predicted": sum(predictions.values())}

    # ── Main budget builder ───────────────────────────────────────────────────
    def create_balanced_budget(
        self,
        transaction_history: list,
        monthly_income: float = None,
        total_budget: float = None,
    ) -> dict:
        """
        Builds a personalized monthly budget.

        Args:
            transaction_history: list of expense dicts from DB
            monthly_income:      user's monthly income (optional)
            total_budget:        user's custom spending cap (optional)

        Returns dict matching aiController.js + BudgetPlan schema.
        """
        notes = []

        # ── Count data months ─────────────────────────────────────────────────
        df = pd.DataFrame(transaction_history)
        if df.empty:
            num_months = 0
        else:
            df["date"] = pd.to_datetime(df["date"], errors="coerce", utc=True)
            df = df.dropna(subset=["date"])
            df = self._filter_expenses(df)
            if df.empty:
                num_months = 0
            else:
                num_months = df["date"].dt.tz_localize(None).dt.to_period("M").nunique()

        # ── Get predicted spend per category ─────────────────────────────────
        base_prediction = self.predict_next_month_budget(transaction_history)["breakdown"]

        # Classify predicted categories into needs / wants
        needs_categories = [c for c in base_prediction if c in self.NEEDS_LABELS]
        wants_categories = [c for c in base_prediction if c in self.WANTS_LABELS]
        # Anything unclassified → treat as wants (safe default)
        unclassified = [c for c in base_prediction if c not in self.NEEDS_LABELS and c not in self.WANTS_LABELS]
        wants_categories += unclassified

        # ── Spending cap & savings ────────────────────────────────────────────
        # use_503020: True when no custom limit → 50/30/20 rule drives allocation
        use_503020 = total_budget is None

        if total_budget is not None:
            spending_cap = float(total_budget)
            savings = max(0.0, float(monthly_income) - spending_cap) if monthly_income else 0.0
            needs_pct = 0.60   # 60% of cap → needs
            wants_pct = 0.40   # 40% of cap → wants
            notes.append("Custom spending limit applied — essentials protected first.")
            if monthly_income and savings == 0:
                notes.append("Spending limit equals or exceeds income — savings set to 0.")
        else:
            if not monthly_income:
                monthly_income = 50000.0
                notes.append(
                    "No income provided — using ৳50,000 as default. "
                    "Set your actual income for a personalized plan."
                )
            monthly_income = float(monthly_income)
            spending_cap = monthly_income * 0.80
            savings      = monthly_income * 0.20
            needs_pct    = 0.625   # 50% of income = 62.5% of spending cap
            wants_pct    = 0.375   # 30% of income = 37.5% of spending cap
            if num_months >= 3:
                notes.append("50/30/20 rule applied, personalized from your spending history.")
            else:
                notes.append(
                    f"Only {num_months} month(s) of data — using 50/30/20 as a safe baseline. "
                    "Keep tracking for a fully personalized plan!"
                )

        # ── Step 1: Fixed needs at full historical amount ─────────────────────
        needs_breakdown: dict = {}
        fixed_allocated = 0.0

        for cat in needs_categories:
            amt = base_prediction.get(cat, 0)
            if amt <= 0:
                continue
            if cat in self.FIXED_CATEGORIES:
                allocated = min(float(amt), spending_cap)
                needs_breakdown[cat] = round(allocated)
                fixed_allocated += allocated

        # ── Step 2: Check if fixed alone exceeds cap ──────────────────────────
        if fixed_allocated >= spending_cap:
            notes.append(
                f"⚠️ Fixed essentials (Rent/EMI: ৳{int(fixed_allocated):,}) meet or exceed "
                f"your ৳{int(spending_cap):,} limit. No room for other categories."
            )
            wants_breakdown: dict = {}
            needs_cap = fixed_allocated
            wants_cap = 0.0
        else:
            # ── Step 3: Distribute remaining after fixed ──────────────────────
            remaining       = spending_cap - fixed_allocated
            variable_budget = remaining * needs_pct
            wants_cap_alloc = remaining * wants_pct

            # Variable needs (groceries, transport, utilities...) → scale to fit
            variable_needs = {
                c: float(base_prediction[c])
                for c in needs_categories
                if c not in self.FIXED_CATEGORIES and base_prediction.get(c, 0) > 0
            }
            variable_sum = sum(variable_needs.values()) or 1.0
            for cat, amt in variable_needs.items():
                needs_breakdown[cat] = round(amt * (variable_budget / variable_sum))

            # Wants → scale to fit
            wants_pred = {
                c: float(base_prediction[c])
                for c in wants_categories
                if base_prediction.get(c, 0) > 0
            }
            wants_sum = sum(wants_pred.values()) or 1.0
            wants_breakdown = {
                c: round(amt * (wants_cap_alloc / wants_sum))
                for c, amt in wants_pred.items()
            }

            needs_cap = fixed_allocated + variable_budget
            wants_cap = wants_cap_alloc

        # ── Fallback: no transaction data ─────────────────────────────────────
        if not needs_breakdown:
            notes.append("No expense history — using standard starter allocation.")
            avail_needs = min(needs_cap, spending_cap - sum(wants_breakdown.values()))
            needs_breakdown = {
                "House Rent":           int(avail_needs * 0.40),
                "Groceries":            int(avail_needs * 0.25),
                "Utilities & Bills":    int(avail_needs * 0.15),
                "Transportation":       int(avail_needs * 0.12),
                "Healthcare":           int(avail_needs * 0.08),
            }

        if not wants_breakdown:
            notes.append("No discretionary history — using standard starter allocation.")
            avail_wants = min(wants_cap, max(0.0, spending_cap - sum(needs_breakdown.values())))
            wants_breakdown = {
                "Dining Out & Food Delivery":    int(avail_wants * 0.30),
                "Entertainment & Subscriptions": int(avail_wants * 0.25),
                "Shopping & Personal Care":      int(avail_wants * 0.20),
                "Travel & Leisure":              int(avail_wants * 0.15),
                "Miscellaneous":                 int(avail_wants * 0.10),
            }

        # ── Hard cap: guarantee total ≤ spending_cap ─────────────────────────
        total_allocated = sum(needs_breakdown.values()) + sum(wants_breakdown.values())
        if total_allocated > spending_cap:
            overflow = total_allocated - spending_cap
            # Trim wants largest-first
            for w in sorted(wants_breakdown, key=lambda k: wants_breakdown[k], reverse=True):
                trim = min(wants_breakdown[w], overflow)
                wants_breakdown[w] = round(wants_breakdown[w] - trim)
                overflow -= trim
                if overflow <= 0:
                    break
            # If still over, trim variable needs (never fixed)
            if overflow > 0:
                for n in sorted(needs_breakdown, key=lambda k: needs_breakdown[k], reverse=True):
                    if n not in self.FIXED_CATEGORIES:
                        trim = min(needs_breakdown[n], overflow)
                        needs_breakdown[n] = round(needs_breakdown[n] - trim)
                        overflow -= trim
                        if overflow <= 0:
                            break

        # ── Savings advice note ───────────────────────────────────────────────
        savings_rate = (savings / float(monthly_income) * 100) if monthly_income else 0
        if savings_rate >= 20:
            notes.append(f"🎉 On track to save ৳{int(savings):,} ({savings_rate:.0f}%) this month!")
        elif savings_rate >= 10:
            notes.append(f"👍 Saving ৳{int(savings):,} ({savings_rate:.0f}%). Aim for 20% for stronger financial health.")
        elif savings_rate > 0:
            notes.append(f"💡 Low savings rate ({savings_rate:.0f}%). Try trimming wants to build a safety net.")

        notes.append("Every month you track, you get one step closer to financial freedom. Keep going! 💪")

        return {
            "monthly_income":      int(monthly_income) if monthly_income else 0,
            "recommended_savings": int(savings),
            "total_living_budget": int(spending_cap),
            "needs_total":         int(needs_cap),
            "needs_breakdown":     needs_breakdown,
            "wants_total":         int(wants_cap),
            "wants_breakdown":     wants_breakdown,
            "note":                notes,
            "using_503020":        use_503020,
            "data_months":         num_months,
        }
