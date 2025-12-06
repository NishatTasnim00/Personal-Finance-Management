import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getNetWorth = async (req, res) => {
    const getUserId = (req) => req.user.uid || req.user.id || req.user.sub;

  try {
    const userId = getUserId(req);

    const [incomeTotal, expenseTotal] = await Promise.all([
      Income.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$amount' } }}]),
    ]);

    const totalIncome = incomeTotal[0]?.total || 0;
    const totalExpense = expenseTotal[0]?.total || 0;
    const netWorth = totalIncome - totalExpense;

    successResponse(res, { netWorth, totalIncome, totalExpense });
  } catch (err) {
    errorResponse(res, 'Server error', 500);
  } 
};