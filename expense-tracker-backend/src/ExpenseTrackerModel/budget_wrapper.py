import sys
import json
import pandas as pd
# Add current directory to path to find budget_planner
sys.path.append('.')
from budget_planner import BudgetAI

def main():
    try:
        # Read JSON from stdin
        input_str = sys.stdin.read()
        if not input_str:
            raise ValueError("No input data received")
            
        input_data = json.loads(input_str)
        
        transaction_history = input_data.get('transactions', [])
        monthly_income = input_data.get('monthly_income')
        total_budget = input_data.get('total_budget') # Optional
        
        # Initialize AI
        ai = BudgetAI()
        
        # Generate budget
        result = ai.create_balanced_budget(
            transaction_history=transaction_history,
            monthly_income=monthly_income,
            total_budget=total_budget
        )
        
        # Convert numpy/pandas types to native python types for JSON serialization
        def convert(o):
            if isinstance(o, (pd.Period, pd.Timestamp)):
                return str(o)
            if hasattr(o, 'item'): # numpy types
                return o.item()
            raise TypeError
            
        # Output result as JSON
        print(json.dumps(result, default=convert))
        
    except Exception as e:
        # Output error as JSON
        error_response = {"error": str(e)}
        print(json.dumps(error_response))
        sys.exit(1)

if __name__ == "__main__":
    main()
