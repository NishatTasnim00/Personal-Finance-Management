import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js'; // To calculate spent
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const getUserId = (req) => req.user.uid || req.user.id || req.user.sub;

export const createBudget = async (req, res) => {
  try {
    const { category, amount, period } = req.body;

    if (!category || !amount || !period) {
      return errorResponse(res, 'Category, amount, and period are required', 400);
    }

    const budget = await Budget.create({
      category: category.trim(),
      amount: Number(amount),
      period,
      userId: getUserId(req),
    });

    successResponse(res, budget, 201, 'Budget created successfully');
  } catch (err) {
    console.error('createBudget error:', err);
    errorResponse(res, err.message || 'Failed to create budget', 500);
  }
};

export const getBudgets = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { period = 'monthly' } = req.query;

    const filter = period === 'all' ? { userId } : { userId, period };
    const budgets = await Budget.find(filter).lean();

    const getPeriodStartDate = (periodType) => {
      const now = new Date();

      switch (periodType) {
        case 'weekly': {
          const start = new Date(now);
          start.setDate(now.getDate() - now.getDay()); // Sunday
          start.setHours(0, 0, 0, 0);
          return start;
        }
        case 'monthly': {
          return new Date(now.getFullYear(), now.getMonth(), 1);
        }
        case 'yearly': {
          return new Date(now.getFullYear(), 0, 1);
        }
        case 'all':
        default:
          return null; 
      }
    };

    const enhancedBudgets = await Promise.all(
      budgets.map(async (b) => {
        const startDate = getPeriodStartDate(b.period);

        const matchFilter = {
          userId,
          category: b.category,
        };

        if (startDate) {
          matchFilter.date = { $gte: startDate };
        }

        const spentResult = await Expense.aggregate([
          { $match: matchFilter },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const spent = spentResult[0]?.total || 0;
        const remaining = b.amount - spent;
        const progress = b.amount > 0 ? (spent / b.amount) * 100 : 0;

        return {
          ...b,
          spent,
          remaining,
          progress: Math.min(progress, 200),
          isOverBudget: spent > b.amount,
        };
      })
    );

    successResponse(res, enhancedBudgets);
  } catch (err) {
    console.error('getBudgets error:', err);
    errorResponse(res, 'Server error', 500);
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { category, amount, period } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: getUserId(req) },
      {
        category: category?.trim(),
        amount: amount ? Number(amount) : undefined,
        period: period || undefined,
      },
      { new: true, runValidators: true }
    );

    if (!budget) return errorResponse(res, 'Budget not found', 404);

    successResponse(res, budget, 200, 'Budget updated');
  } catch (err) {
    console.error('updateBudget error:', err);
    errorResponse(res, err.message || 'Failed to update', 500);
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: getUserId(req),
    });

    if (!budget) return errorResponse(res, 'Budget not found', 404);

    successResponse(res, null, 200, 'Budget deleted');
  } catch (err) {
    console.error('deleteBudget error:', err);
    errorResponse(res, 'Server error', 500);
  }
};