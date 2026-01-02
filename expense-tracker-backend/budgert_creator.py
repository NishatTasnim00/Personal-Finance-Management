def create_smart_budget(
    transactions,
    monthly_income,
    spending_boundary=None,
    currency="৳"
):
    """
    No training. No labels. Just pure intelligence + kindness.
    Understands Bengali/English real-life spending automatically.
    """
    import pandas as pd
    import numpy as np

    df = transactions.copy()
    if df.empty:
        return {"message": "No transactions yet. Enter your income → we’ll start simple!"}
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce').fillna(0)
    df = df.dropna(subset=['Date'])
    df['Category'] = df['Category'].astype(str).str.upper().str.strip()
    df['month'] = df['Date'].dt.to_period('M')

    # Group by month and category
    monthly_spend = df.groupby(['month', 'Category'])['Amount'].sum().unstack(fill_value=0)
    print('monthly expense',  monthly_spend)


    # LAST 6 MONTHS ONLY
    cutoff = df['Date'].max() - pd.DateOffset(months=6)
    last_6_months = df[df['Date'] >= cutoff].copy()



    # WEIGHTED AVERAGE — latest month has highest weight
    weights = np.arange(1, len(monthly_spend) + 1) ** 1.3  # slight exponential weight
    smart_avg = np.average(monthly_spend, axis=0, weights=weights)
    last_6_months_avg = pd.Series(smart_avg, index=monthly_spend.columns)
    last_6_months_avg = last_6_months_avg[last_6_months_avg > 300].sort_values(ascending=False)  # filter tiny noise

    # SMART AUTO CLASSIFICATION — This is the magic
    fixed_needs = []  # Can't reduce: rent, EMI, utilities
    variable_needs = []  # Can adjust slightly: groceries, basic transport
    essential_wants = []  # Frequent lifestyle: e.g., regular coffee if every month
    luxury_wants = []  # Infrequent fun

    for desc, amt in last_6_months_avg.items():
        d = desc.lower()
        frequency = (monthly_spend.get(desc, pd.Series(0)) > 0).sum()  # freq in last 6 months

        # Fixed Needs (non-negotiable)
        if any(k in d for k in ['rent', 'house', 'flat', 'bari', 'basa', 'ভাড়া', 'emi', 'loan', 'mortgage']):
            fixed_needs.append((desc, amt))
        elif any(k in d for k in ['utilities', 'electric', 'bill', 'wasa', 'gas', 'internet', 'wifi', 'grameen', 'robi', 'airtel']):
            fixed_needs.append((desc, amt))
        elif any(k in d for k in ['school', 'college', 'tution', 'tuition', 'coach', 'education']):
            fixed_needs.append((desc, amt))

        # Variable Needs
        elif any(k in d for k in ['grocer', 'bazar', 'shwapno', 'meena', 'super shop', 'market', 'food']):
            variable_needs.append((desc, amt))
        elif any(k in d for k in ['health', 'labaid', 'medicine', 'doctor']):
            variable_needs.append((desc, amt))
        elif 'fitness' in d and frequency < 4:  # infrequent gym = want
            luxury_wants.append((desc, amt))
        elif 'fitness' in d:
            essential_wants.append((desc, amt))

        # Wants
        elif any(k in d for k in ['entertainment', 'foodpanda', 'pathao', 'uber', 'daraz', 'shopping', 'movie', 'coffee', 'cafe', 'travel', 'netflix', 'youtube', 'spotify', 'game', 'pubg', 'gift']):
            if frequency >= 4:  # appears in 4+ of last 6 months → essential want
                essential_wants.append((desc, amt))
            else:
                luxury_wants.append((desc, amt))

        else:
            # Default: based on frequency and amount
            if frequency >= 4 and amt > 3000:
                fixed_needs.append((desc, amt))  # frequent big = fixed need
            elif frequency >= 4:
                essential_wants.append((desc, amt))
            else:
                luxury_wants.append((desc, amt))

    # Sort by amount descending
    fixed_needs.sort(key=lambda x: x[1], reverse=True)
    variable_needs.sort(key=lambda x: x[1], reverse=True)
    essential_wants.sort(key=lambda x: x[1], reverse=True)
    luxury_wants.sort(key=lambda x: x[1], reverse=True)

    # Convert to dicts with slight buffer (5%)
    fixed_needs_dict = {desc: round(amt * 1.05) for desc, amt in fixed_needs[:10]}
    variable_needs_dict = {desc: round(amt * 1.05) for desc, amt in variable_needs[:10]}
    essential_wants_dict = {desc: round(amt * 1.05) for desc, amt in essential_wants[:5]}
    luxury_wants_dict = {desc: round(amt * 1.05) for desc, amt in luxury_wants[:5]}

    print(fixed_needs_dict)
    print(variable_needs_dict)
    print(essential_wants_dict)
    print(luxury_wants_dict)

    # Totals
    fixed_total = sum(fixed_needs_dict.values())
    variable_total = sum(variable_needs_dict.values())
    essential_wants_total = sum(essential_wants_dict.values())
    luxury_wants_total = sum(luxury_wants_dict.values())

    # BOUNDARY LOGIC
    if spending_boundary is not None:
        available = spending_boundary
        savings = 0
        note = "Boundary active → savings paused. Protected your must-haves first."
    else:
        available = monthly_income * 0.80
        savings = monthly_income * 0.20
        note = "No boundary → aiming for 50/30/20 with strong savings!"

    # Allocation logic: Prioritize fixed > variable > essential wants > luxury
    remaining = available
    fixed_budget = {k: v for k, v in fixed_needs_dict.items()}  # Never scale down fixed
    remaining -= fixed_total

    if remaining < 0:
        # Can't cover fixed
        variable_budget = {}
        essential_wants_budget = {}
        luxury_wants_budget = {}
        final_note = f"Alert: Income too low to cover fixed essentials ({currency}{fixed_total:,} needed). Consider extra income or assistance. You're not alone — let's plan step by step."
    else:
        # Allocate to variable needs (scale if needed, but min 80% of avg)
        scale_variable = min(1, remaining * 0.50 / variable_total) if variable_total > 0 else 1
        scale_variable = max(0.80, scale_variable)  # Don't cut variable needs too much
        variable_budget = {k: max(500, int(v * scale_variable)) for k, v in variable_needs_dict.items()}
        variable_alloc = sum(variable_budget.values())
        remaining -= variable_alloc

        if remaining <= 0:
            essential_wants_budget = {}
            luxury_wants_budget = {}
            final_note = "Tight budget — covered needs, but skipped wants. Focus on essentials; better months ahead."
        else:
            # Essential wants (scale, min 50%)
            scale_essential = min(1, remaining * 0.60 / essential_wants_total) if essential_wants_total > 0 else 1
            scale_essential = max(0.50, scale_essential)
            essential_wants_budget = {k: int(v * scale_essential) for k, v in essential_wants_dict.items()}
            essential_alloc = sum(essential_wants_budget.values())
            remaining -= essential_alloc

            if remaining <= 0:
                luxury_wants_budget = {}
                final_note = "Covered needs + key wants. No room for extras this month — smart choices!"
            else:
                # Luxury wants (whatever left)
                scale_luxury = remaining / luxury_wants_total if luxury_wants_total > 0 else 1
                luxury_wants_budget = {k: int(v * scale_luxury) for k, v in luxury_wants_dict.items()}
                final_note = note
                print(f"Remaining: {remaining}")
                savings += remaining

    # Combine for output
    needs_budget = {**fixed_budget, **variable_budget}
    wants_budget = {**essential_wants_budget, **luxury_wants_budget}

    return {
        "Your Income": f"{currency}{monthly_income:,}",
        "Savings This Month": f"{currency}{int(savings):,}",
        "Living Money": f"{currency}{int(available):,}",
        "Needs (Protected)": f"{currency}{sum(needs_budget.values()):,}",
        "needs_breakdown": {k: f"{currency}{v:,}" for k, v in needs_budget.items()},
        "Wants (Lifestyle)": f"{currency}{sum(wants_budget.values()):,}",
        "wants_breakdown": {k: f"{currency}{v:,}" for k, v in wants_budget.items()},
        "From Your Budget Friend": final_note,
        "You're Doing Great": "Every month you track, you get stronger. Keep going — freedom is coming."
    }