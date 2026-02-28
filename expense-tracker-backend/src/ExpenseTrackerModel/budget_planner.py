import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
# from ollama_llm_categorizer import LLMCategorizer   
# Ollama won't run in render 

# Mock if you don't want to depend on it right now
class LLMCategorizer:
    def predict(self, description):
        return "Uncategorized"  # fallback – replace with real logic

class BudgetAI:
    def __init__(self):
        self.categorizer = LLMCategorizer()
        
        self.mandatory_labels = [
            "Rent", "House Rent", "Home Rent", "Apartment", "Housing",
            "Groceries", "Grocery", "Supermarket", "Vegetables", "Fruits", "Meat", "Fish",
            "Utilities", "Electricity", "Water", "Gas", "Internet", "WiFi", "Utility", "Bills",
            "Mobile", "Phone Bill", "Recharge", "Broadband",
            "Transportation", "Transport", "Fuel", "Petrol", "CNG", "Ride", "Bus", "Metro", "Taxi", "Pathao", "Uber",
            "EMI", "Loan EMI", "Installment", "Debt", "Loan", "Insurance", "EMI/Loan/Insurance",
            "Education", "School", "Tuition", "University", "Books",
            "Healthcare", "Medicine", "Doctor", "Hospital", "Pharmacy", "Health", "Medical",
        ]

        self.wants_labels = [
            "Dining Out", "Food Delivery", "Restaurant", "Zomato", "Pathao Food", "Coffee",
            "Entertainment", "Subscriptions", "Netflix", "YouTube", "Spotify", "Movies", "Cinema",
            "Shopping", "Clothing", "Fashion", "Accessories", "Personal Care", "Gifts",
            "Travel", "Leisure", "Vacation", "Tour",
            "Miscellaneous", "Fun", "Hobby",
        ]

        # Truly fixed — never reduce below historical average
        self.fixed_budget = ["Rent", "House Rent", "Home Rent", "EMI", "Loan EMI", "Installment"]

    def _predict_category_trend(self, cat_data):
        if len(cat_data) == 0:
            return 0

        monthly = cat_data.groupby(cat_data["date"].dt.to_period("M"))["amount"].sum()
        values = monthly[monthly > 0].dropna()

        if len(values) == 0:
            return 0

        if len(values) <= 3:
            return round(values.mean() * 1.05)

        X = np.arange(len(values)).reshape(-1, 1)
        y = values.values
        reg = LinearRegression().fit(X, y)

        next_month_idx = len(values)
        pred = reg.predict([[next_month_idx]])[0]

        if reg.coef_[0] <= 0:
            return round(values.mean())
        else:
            max_val = values.max()
            capped_pred = min(pred, max_val * 1.25)  # slightly more generous cap
            return round(capped_pred * 1.05)

    def _filter_expenses(self, df):
        df = df.copy()
        col_map = {c.lower(): c for c in df.columns}
        if "type" in col_map:
            type_col = col_map["type"]
            df = df[df[type_col].astype(str).str.lower().str.strip() != "income"]
        df["amount"] = df["amount"].abs()
        return df

    def is_need(self, category):
        if not isinstance(category, str):
            return False
        cat = category.lower()
        need_indicators = [
            'rent', 'house', 'home', 'emi', 'loan', 'installment', 'debt', 'grocery',
            'food home', 'supermarket', 'utility', 'electric', 'water', 'gas', 'internet',
            'bill', 'mobile', 'recharge', 'transport', 'fuel', 'bus', 'train', 'metro',
            'education', 'school', 'tuition', 'health', 'doctor', 'medicine', 'hospital',
            'insurance'
        ]
        for word in need_indicators:
            if word in cat:
                return True
        return category in self.mandatory_labels

    def predict_next_month_budget(self, transaction_history):
        df = pd.DataFrame(transaction_history)
        if df.empty:
            return {"breakdown": {}, "total_predicted": 0}

        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.dropna(subset=["date", "amount", "category"])
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce")

        df = self._filter_expenses(df)

        if df.empty:
            return {"breakdown": {}, "total_predicted": 0}

        df["predicted_category"] = df["category"].apply(self.categorizer.predict)

        predictions = {}
        for cat in df["predicted_category"].unique():
            if pd.isna(cat) or cat == "":
                continue
            cat_data = df[df["predicted_category"] == cat]
            predictions[cat] = self._predict_category_trend(cat_data)

        return {"breakdown": predictions, "total_predicted": sum(predictions.values())}

    def create_balanced_budget(self, transaction_history, monthly_income, total_budget=None):
        notes = []

        # Fallback income if nothing provided
        if monthly_income is None:
            monthly_income = 50000
            notes.append("No income provided — using sample ৳50,000. Please enter your actual income.")

        base = self.predict_next_month_budget(transaction_history)
        base_prediction = base["breakdown"]

        # Classify categories more reliably
        needs_categories = [c for c in base_prediction if self.is_need(c)]
        wants_categories = [c for c in base_prediction if not self.is_need(c)]

        num_months = len(set(pd.to_datetime(t["date"]).to_period("M") for t in transaction_history 
                            if t.get("date"))) if transaction_history else 0

        use_503020 = num_months >= 3

        # Spending & Savings logic
        if total_budget is not None:
            spending_cap = total_budget
            savings = max(0, monthly_income - total_budget)
            if total_budget > monthly_income:
                notes.append("Warning: Spending limit > income → savings set to 0")
            needs_pct = 0.65  # protect needs more when constrained
            wants_pct = 0.35
        else:
            spending_cap = monthly_income * 0.80
            savings = monthly_income * 0.20
            needs_pct = 0.625   # ≈50% of income
            wants_pct = 0.375   # ≈30% of income

        needs_cap = spending_cap * needs_pct
        wants_cap = spending_cap * wants_pct

        needs_sum = sum(base_prediction.get(c, 0) for c in needs_categories) or 1
        wants_sum = sum(base_prediction.get(c, 0) for c in wants_categories) or 1

        needs_breakdown = {
            c: round(base_prediction.get(c, 0) * (needs_cap / needs_sum))
            for c in needs_categories if base_prediction.get(c, 0) > 0
        }
        wants_breakdown = {
            c: round(base_prediction.get(c, 0) * (wants_cap / wants_sum))
            for c in wants_categories if base_prediction.get(c, 0) > 0
        }

        # Protect fixed / large essential costs
        for fixed_cat in self.fixed_budget:
            if fixed_cat in base_prediction:
                historical = base_prediction[fixed_cat]
                current = needs_breakdown.get(fixed_cat, 0)
                if current < historical * 0.9:
                    needs_breakdown[fixed_cat] = historical
                    excess = historical - current
                    if wants_breakdown:
                        reduction = excess / max(1, len(wants_breakdown))
                        for w in wants_breakdown:
                            wants_breakdown[w] = max(0, wants_breakdown[w] - reduction)
                    notes.append(f"Protected full amount for {fixed_cat}")

        # Minimum size guardrail (prevents tiny or zero categories)
        MIN_PCT = 0.05
        for cat in list(needs_breakdown.keys()):
            if needs_breakdown[cat] < needs_cap * MIN_PCT and needs_breakdown[cat] > 0:
                needs_breakdown[cat] = round(needs_cap * 0.08)

        # Fallback if no needs detected at all
        if not needs_breakdown or sum(needs_breakdown.values()) < needs_cap * 0.4:
            needs_breakdown = {
                "House Rent": round(needs_cap * 0.40),
                "Groceries": round(needs_cap * 0.25),
                "Utilities & Bills": round(needs_cap * 0.15),
                "Transportation": round(needs_cap * 0.12),
                "Healthcare / Insurance": round(needs_cap * 0.08),
            }
            notes.append("Using standard essential categories (no strong needs detected in history)")

        # Fallback for wants
        if not wants_breakdown:
            wants_breakdown = {
                "Dining Out & Food Delivery": round(wants_cap * 0.30),
                "Entertainment & Subscriptions": round(wants_cap * 0.25),
                "Shopping & Personal Care": round(wants_cap * 0.20),
                "Travel & Leisure": round(wants_cap * 0.15),
                "Miscellaneous Fun": round(wants_cap * 0.10),
            }

        return {
            "monthly_income": int(monthly_income),
            "recommended_savings": int(savings),
            "total_living_budget": int(spending_cap),
            "needs_total": int(needs_cap),
            "needs_breakdown": needs_breakdown,
            "wants_total": int(wants_cap),
            "wants_breakdown": wants_breakdown,
            "note": notes,
            "using_503020": use_503020,
            "data_months": num_months,
            "predicted_raw": base_prediction,
        }


# ────────────────────────────────────────────────
#                  Example usage
# ────────────────────────────────────────────────

if __name__ == "__main__":
    # For testing — replace with your real data
    sample_history = []  # ← put your transactions here if you want to test

    ai = BudgetAI()

    result = ai.create_balanced_budget(
        transaction_history=sample_history,
        monthly_income=40000,   # ← matches your screenshot
        total_budget=None
    )

    print("\n" + "="*70)
    print("              YOUR BUDGET PLAN – 2026-02")
    print("="*70)
    print(f"Monthly Income       : ৳{result['monthly_income']:,}")
    print(f"Recommended Savings  : ৳{result['recommended_savings']:,}")
    print(f"Living Budget        : ৳{result['total_living_budget']:,}")
    print(f"Data history         : {result['data_months']} months\n")

    print(f"Needs (৳{result['needs_total']:,}):")
    for cat, amt in sorted(result["needs_breakdown"].items(), key=lambda x: x[1], reverse=True):
        print(f"   • {cat:<22} ৳{amt:,}")

    print(f"\nWants (৳{result['wants_total']:,}):")
    for cat, amt in sorted(result["wants_breakdown"].items(), key=lambda x: x[1], reverse=True):
        print(f"   • {cat:<22} ৳{amt:,}")

    print("\nNotes:")
    for note in result["note"]:
        print(f"• {note}")

    print("="*70)