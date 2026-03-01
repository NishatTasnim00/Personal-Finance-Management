"""
budget_wrapper.py
Entry point called by aiController.js via stdin/stdout.
Reads JSON from stdin → runs model → writes JSON to stdout.
"""
import sys
import json

def main():
    try:
        raw = sys.stdin.read()
        input_data = json.loads(raw)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse input: {str(e)}"}))
        sys.exit(1)

    transactions = input_data.get("transactions", [])
    monthly_income = float(input_data.get("monthly_income", 0))
    total_budget = input_data.get("total_budget")  # optional spending boundary

    try:
        result = create_smart_budget(
            transactions=transactions,
            monthly_income=monthly_income,
            spending_boundary=float(total_budget) if total_budget else None,
        )
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Model error: {str(e)}"}))
        sys.exit(1)


def create_smart_budget(transactions, monthly_income, spending_boundary=None):
    """
    Analyzes expense transactions and generates a smart monthly budget plan.

    Input:
        transactions    - list of dicts with keys: date, amount, category, description
        monthly_income  - user's monthly income (number)
        spending_boundary - optional hard cap on total spending

    Output (matches aiController.js + BudgetPlan mongoose schema):
        monthly_income        - number
        recommended_savings   - number
        total_living_budget   - number
        needs_total           - number
        wants_total           - number
        needs_breakdown       - dict of { category: amount (number) }
        wants_breakdown       - dict of { category: amount (number) }
        note                  - list of strings (advice messages)
    """
    from collections import defaultdict
    from datetime import datetime, timedelta

    # ── 1. Parse & clean transactions ────────────────────────────────────────
    parsed = []
    for t in transactions:
        try:
            date = datetime.fromisoformat(t["date"].replace("Z", "+00:00"))
            amount = float(t.get("amount", 0))
            category = str(t.get("category") or t.get("description") or "other").strip().upper()
            if amount > 0:
                parsed.append({"date": date, "amount": amount, "category": category})
        except Exception:
            continue

    # ── 2. Empty data fallback ────────────────────────────────────────────────
    if not parsed:
        savings = monthly_income * 0.20
        living = monthly_income * 0.80
        return {
            "monthly_income": monthly_income,
            "recommended_savings": round(savings),
            "total_living_budget": round(living),
            "needs_total": 0,
            "wants_total": 0,
            "needs_breakdown": {},
            "wants_breakdown": {},
            "note": [
                "No transaction history yet.",
                "We recommend saving 20% of your income and using 80% for living expenses.",
                "Start tracking your expenses to get a personalized plan!"
            ]
        }

    # ── 3. Use last 6 months only ─────────────────────────────────────────────
    if parsed:
        latest_date = max(t["date"] for t in parsed)
    else:
        latest_date = datetime.now()
    cutoff = latest_date - timedelta(days=180)
    recent = [t for t in parsed if t["date"] >= cutoff]
    if not recent:
        recent = parsed  # fall back to all data if nothing recent

    # ── 4. Monthly spend per category ─────────────────────────────────────────
    # Group by (year-month, category)
    monthly_cat = defaultdict(lambda: defaultdict(float))
    for t in recent:
        ym = t["date"].strftime("%Y-%m")
        monthly_cat[ym][t["category"]] += t["amount"]

    months = sorted(monthly_cat.keys())
    num_months = max(len(months), 1)

    # ── 5. Weighted average per category (recent months weighted higher) ──────
    all_categories = set(cat for m in monthly_cat.values() for cat in m)
    cat_avg = {}
    for cat in all_categories:
        monthly_vals = []
        for i, ym in enumerate(months):
            weight = (i + 1) ** 1.3  # exponential recency weight
            val = monthly_cat[ym].get(cat, 0)
            monthly_vals.append((val, weight))

        total_weight = sum(w for _, w in monthly_vals)
        weighted_avg = sum(v * w for v, w in monthly_vals) / total_weight
        if weighted_avg >= 100:  # filter out noise (< ৳100/month)
            cat_avg[cat] = weighted_avg

    # ── 6. Smart classification ───────────────────────────────────────────────
    needs = {}
    wants = {}

    NEED_KEYWORDS = [
        "rent", "house", "flat", "bari", "basa", "emi", "loan", "mortgage",
        "utilities", "electric", "bill", "wasa", "gas", "internet", "wifi",
        "school", "college", "tuition", "tution", "education", "coach",
        "grocer", "bazar", "market", "food", "vegetable", "rice", "grocery",
        "health", "medicine", "doctor", "hospital", "pharmacy", "transport",
        "rickshaw", "bus", "cng", "fuel", "petrol",
    ]

    WANT_KEYWORDS = [
        "restaurant", "dining", "cafe", "coffee", "fast food", "foodpanda",
        "entertainment", "movie", "cinema", "netflix", "spotify", "youtube",
        "shopping", "daraz", "clothing", "fashion",
        "travel", "trip", "hotel", "vacation",
        "gym", "fitness", "sport",
        "gift", "party", "celebration",
        "game", "pubg", "mobile recharge",
        "beauty", "salon", "cosmetic",
    ]

    # Track how many months each category appeared (for frequency scoring)
    cat_frequency = {
        cat: sum(1 for ym in months if monthly_cat[ym].get(cat, 0) > 0)
        for cat in all_categories
    }

    for cat, avg in cat_avg.items():
        lower = cat.lower()
        freq = cat_frequency.get(cat, 0)

        if any(k in lower for k in NEED_KEYWORDS):
            needs[cat] = avg
        elif any(k in lower for k in WANT_KEYWORDS):
            wants[cat] = avg
        else:
            # Heuristic: frequent + large → need; infrequent/small → want
            if freq >= (num_months * 0.6) and avg >= 2000:
                needs[cat] = avg
            else:
                wants[cat] = avg

    # ── 7. Budget allocation ──────────────────────────────────────────────────
    # Available spending = income - savings target
    if spending_boundary is not None:
        available = float(spending_boundary)
        target_savings = max(0, monthly_income - available)
        note = ["Custom spending boundary applied."]
    else:
        target_savings = monthly_income * 0.20
        available = monthly_income * 0.80
        note = ["Targeting 20% savings rate (recommended)."]

    needs_raw_total = sum(needs.values())
    wants_raw_total = sum(wants.values())

    # Add 5% buffer to all estimates
    BUFFER = 1.05

    # Allocate needs first (up to 60% of available, but never cut below 85% of avg)
    if needs_raw_total > 0:
        needs_alloc = min(available * 0.65, needs_raw_total * BUFFER)
        needs_scale = needs_alloc / (needs_raw_total * BUFFER)
        needs_scale = max(needs_scale, 0.85)  # never cut needs below 85%
    else:
        needs_alloc = 0
        needs_scale = 1.0

    needs_breakdown = {
        cat: round(amt * BUFFER * needs_scale)
        for cat, amt in sorted(needs.items(), key=lambda x: -x[1])[:12]
    }
    actual_needs_total = sum(needs_breakdown.values())

    # Remaining for wants
    remaining_for_wants = max(0, available - actual_needs_total)

    if wants_raw_total > 0 and remaining_for_wants > 0:
        wants_scale = min(1.0, remaining_for_wants / (wants_raw_total * BUFFER))
        wants_breakdown = {
            cat: round(amt * BUFFER * wants_scale)
            for cat, amt in sorted(wants.items(), key=lambda x: -x[1])[:8]
        }
    else:
        wants_breakdown = {}

    actual_wants_total = sum(wants_breakdown.values())
    actual_spending = actual_needs_total + actual_wants_total
    recommended_savings = max(0, monthly_income - actual_spending)

    # ── 8. Build advice notes ─────────────────────────────────────────────────
    savings_rate = (recommended_savings / monthly_income * 100) if monthly_income > 0 else 0

    if monthly_income < actual_needs_total:
        note.append(
            f"⚠️ Your income (৳{monthly_income:,.0f}) is lower than your estimated needs "
            f"(৳{actual_needs_total:,.0f}). Consider reducing fixed costs or finding additional income."
        )
    elif savings_rate < 10:
        note.append("💡 Your savings rate is low. Try reducing discretionary spending to save more.")
    elif savings_rate >= 20:
        note.append(f"🎉 Great job! You're on track to save ৳{recommended_savings:,.0f} this month ({savings_rate:.0f}%).")
    else:
        note.append(f"👍 You're saving ৳{recommended_savings:,.0f} this month. Aim for 20% savings for financial security.")

    if not wants_breakdown:
        note.append("No budget left for discretionary spending this month. Focus on needs first.")

    note.append("Every month you track your spending, you build a clearer path to financial freedom. Keep it up!")

    # ── 9. Return result matching controller + DB schema ─────────────────────
    return {
        "monthly_income": round(monthly_income),
        "recommended_savings": round(recommended_savings),
        "total_living_budget": round(available),
        "needs_total": actual_needs_total,
        "wants_total": actual_wants_total,
        "needs_breakdown": needs_breakdown,
        "wants_breakdown": wants_breakdown,
        "note": note,
    }


if __name__ == "__main__":
    main()
