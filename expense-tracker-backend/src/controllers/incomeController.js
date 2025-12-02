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

  try {
    const userId = getUserId(req);
    const {
      period = 'all',
      startDate,
      endDate,
      source
    } = req.query;

    // ———————— Always correct Bangladesh Time (Asia/Dhaka) ————————
    const nowInBD = new Date().toLocaleString("en-CA", {
      timeZone: "Asia/Dhaka",
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const nowBD = new Date(nowInBD); // Current time in Bangladesh

    // Today at 00:00:00 in Bangladesh
    const todayStartBD = new Date(
      nowBD.getFullYear(),
      nowBD.getMonth(),
      nowBD.getDate()
    );

    // Auto-switch to custom if dates provided
    let activePeriod = period.toString().trim().toLowerCase();
    if (startDate && endDate) {
      activePeriod = 'custom';
    }

    let searchStartDate = null;
    let searchEndDate = null;
    let dateFilter = {};

    switch (activePeriod) {
      case 'today':
        searchStartDate = todayStartBD;
        searchEndDate = nowBD;
        dateFilter = { date: { $gte: todayStartBD } };
        break;

      case 'week':
        // Bangladesh week starts on SATURDAY
        const dayOfWeek = nowBD.getDay(); // 0=Sunday, 6=Saturday
        const daysBackToSaturday = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;

        const weekStart = new Date(todayStartBD);
        weekStart.setDate(todayStartBD.getDate() - daysBackToSaturday);

        searchStartDate = weekStart;
        searchEndDate = nowBD;
        dateFilter = { date: { $gte: weekStart } };
        break;

      case 'month':
        const monthStart = new Date(nowBD.getFullYear(), nowBD.getMonth(), 1);
        searchStartDate = monthStart;
        searchEndDate = nowBD;
        dateFilter = { date: { $gte: monthStart } };
        break;

      case 'year':
        const yearStart = new Date(nowBD.getFullYear(), 0, 1);
        searchStartDate = yearStart;
        searchEndDate = nowBD;
        dateFilter = { date: { $gte: yearStart } };
        break;

      case 'custom':
        if (!startDate || !endDate) {
          return errorResponse(res, 'startDate and endDate are required.', 400);
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return errorResponse(res, 'Invalid date format. Use YYYY-MM-DD', 400);
        }

        searchStartDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
        searchEndDate = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999));

        dateFilter = {
          date: {
            $gte: searchStartDate,
            $lte: searchEndDate
          }
        };
        break;

      case 'all':
      default:
        searchStartDate = null;
        searchEndDate = null;
        dateFilter = {};
        break;
    }

    // Build MongoDB query
    const query = {
      userId,
      ...dateFilter
    };

    if (source && source.toString().trim() !== '') {
      query.source = source.toString().trim();
    }

    // Fetch incomes
    const incomes = await Income.find(query)
      .sort({ date: -1 })
      .lean();

    const formattedIncomes = incomes.map(inc => ({
      ...inc,
      date: new Date(inc.date).toISOString().split('T')[0]
    }));

    const totalAmount = formattedIncomes.reduce((sum, inc) => sum + inc.amount, 0);

    // Helper to format date as YYYY-MM-DD
    const format = (date) => date ? new Date(date).toISOString().split('T')[0] : null;

    successResponse(res, {
      incomes: formattedIncomes,
      count: formattedIncomes.length,
      totalAmount,
      period: activePeriod,
      source: source?.toString().trim() || 'all sources',
      searchStartDate: format(searchStartDate),
      searchEndDate: format(searchEndDate),
      dateRange: searchStartDate && searchEndDate
        ? `${format(searchStartDate)} to ${format(searchEndDate)}`
        : 'All time'
    });

  } catch (err) {
    console.error('getIncomes error:', err);
    errorResponse(res, 'Server error', 500);
  }
};

// UPDATE (PATCH)
export const updateIncome = async (req, res) => {
  try {
    const { source, icon, color, description, amount, date } = req.body;

    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: getUserId(req) },
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

    console.log(income);

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
      _id: req.params.id,
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