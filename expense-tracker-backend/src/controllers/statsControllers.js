import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import SavingsGoal from '../models/SavingsGoal.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getNetWorth = async (req, res) => {
    const getUserId = (req) => req.user.uid || req.user.id || req.user.sub;

  try {
    const userId = getUserId(req);

    const [incomeTotal, expenseTotal, savingsTotal] = await Promise.all([
      Income.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      SavingsGoal.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$currentAmount' } } }]),
    ]);

    const totalIncome = incomeTotal[0]?.total || 0;
    const totalExpense = expenseTotal[0]?.total || 0;
    const totalSavings = savingsTotal[0]?.total || 0;
    const netWorth = (totalIncome - totalExpense) + totalSavings;

    successResponse(res, { netWorth, totalIncome, totalExpense, totalSavings });
  } catch (err) {
    errorResponse(res, 'Server error', 500);
  } 
};

export const getSavingsStats = async (req, res) => {
  const getUserId = (req) => req.user.uid || req.user.id || req.user.sub;
  try {
    const userId = getUserId(req);
    const stats = await SavingsGoal.aggregate([
      { $match: { userId } },
      { 
        $group: { 
          _id: null, 
          totalTarget: { $sum: '$targetAmount' }, 
          totalSaved: { $sum: '$currentAmount' },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    const result = stats[0] || { totalTarget: 0, totalSaved: 0, count: 0 };
    successResponse(res, result);
  } catch (err) {
    errorResponse(res, 'Server error', 500);
  }
};