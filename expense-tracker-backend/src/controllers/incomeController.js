import Income from '../models/Income.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const getUserId = (req) => req.user.uid || req.user.id || req.user.sub;

// CREATE
export const createIncome = async (req, res) => {
  try {
    const { source, icon, color, description, amount, date } = req.body;

    // Basic required fields
    if (!source || !amount || !date) {
      return errorResponse(res, 'All fields are required', 400);
    }

    const income = await Income.create({
      source: source.trim(),
      icon: icon?.trim(),
      color: color?.trim(),
      description: description?.trim(),
      amount: Number(amount),
      date: new Date(date),
      userId: getUserId(req),
    });

    const responseData = {
      id: income._id,
      source: income.source,
      icon: income.icon,
      color: income.color,
      description: income.description,
      amount: income.amount,
      date: income.date.toISOString().split('T')[0],
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    };

    successResponse(res, responseData, 201, 'Income added successfully');
  } catch (err) {
    console.error('createIncome error:', err);
    errorResponse(res, err.message || 'Failed to add income', 500);
  }
};

// READ ALL
// src/controllers/incomeController.js
export const getIncomes = async (req, res) => {
  console.log(req.query);
  try {
    const userId = getUserId(req);
    const { 
      period = 'month',     // all | month | week | year | custom
      startDate, 
      endDate,
      source

    } = req.query;

    let dateFilter = {};

    const now = new Date();
    const startOfDay = new Date(now.setHours(0,0,0,0));

    switch (period) {
      case 'today':
        dateFilter = { date: { $gte: startOfDay } };
        break;
      case 'week':
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        dateFilter = { date: { $gte: startOfWeek } };
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { date: { $gte: startOfMonth } };
        break;
      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateFilter = { date: { $gte: startOfYear } };
        break;
      case 'custom':
        if (!startDate || !endDate) {
          return errorResponse(res, 'startDate and endDate required.', 400);
        }
        dateFilter = {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23,59,59,999))
          }
        };
        break;
      default: // 'all'
        dateFilter = {};
    }
console.log({ userId, ...dateFilter, source });

// Build the final query object safely
    const query = {
      userId,
      ...dateFilter,
    };

    // Only add source filter if it's provided and not empty
    if (source && source.trim() !== '') {
      query.source = source.trim(); // exact match
      // Or use case-insensitive: query.source = { $regex: new RegExp(`^${source.trim()}$`, 'i') };
    }

    const incomes = await Income.find(query)
      .sort({ date: -1 })
      .lean();

    // Format dates
    const formatted = incomes.map(income => ({
      ...income,
      date: income.date.toISOString().split('T')[0],
    }));

    successResponse(res, {
      incomes: formatted,
      count: formatted.length,
      period,
      source: source || 'all sources',
      totalAmount: formatted.reduce((sum, income) => sum + income.amount, 0)
    });
  } catch (err) {
    errorResponse(res, 'Server error', 500);
  }
};

// UPDATE (PATCH)
export const updateIncome = async (req, res) => {
  try {
    const { source, icon, color, description, amount, date } = req.body;

    const income = await Income.findOneAndUpdate(
      { id: req.params.id, userId: getUserId(req) },
      {
        source: source?.trim(),
        icon: icon?.trim(),
        color: color?.trim(),
        description: description?.trim(),
        amount: amount ? Number(amount) : undefined,
        date: date ? new Date(date) : undefined,
      },
      { new: true, runValidators: true }
    ).select('-userId -__v');

    if (!income) {
      return errorResponse(res, 'Income not found', 404);
    }

    const formatted = {
      id: income._id,
      source: income.source,
      icon: income.icon,
      color: income.color,
      description: income.description,
      amount: income.amount,
      date: income.date.toISOString().split('T')[0],
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    };

    successResponse(res, formatted, 200, 'Income updated');
  } catch (err) {
    console.error('updateIncome error:', err);
    errorResponse(res, err.message || 'Failed to update', 500);
  }
};

// DELETE
export const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({
      id: req.params.id,
      userId: getUserId(req),
    });

    if (!income) {
      return errorResponse(res, 'Income not found', 404);
    }

    successResponse(res, null, 200, 'Income deleted successfully');
  } catch (err) {
    console.error('deleteIncome error:', err);
    errorResponse(res, 'Server error', 500);
  }
};