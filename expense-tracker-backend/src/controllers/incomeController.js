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
    const { period = 'all', startDate, endDate, source } = req.query;

    // Auto-switch to custom if dates are provided
    let activePeriod = period.toString().trim().toLowerCase();
    if (startDate && endDate) {
      activePeriod = 'custom';
    }

    let dateFilter = {};

    // Use UTC-based date calculations (standard & reliable)
    const now = new Date(); // Current UTC time

    switch (activePeriod) {
      case 'today': {
        const startOfDay = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );
        dateFilter = { date: { $gte: startOfDay } };
        break;
      }

      case 'week': {
        // Week starts on Sunday (ISO: Monday, but many prefer Sunday)
        const day = now.getUTCDay(); // 0 = Sunday
        const startOfWeek = new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - day
          )
        );
        dateFilter = { date: { $gte: startOfWeek } };
        break;
      }

      case 'month': {
        const startOfMonth = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
        );
        dateFilter = { date: { $gte: startOfMonth } };
        break;
      }

      case 'year': {
        const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        dateFilter = { date: { $gte: startOfYear } };
        break;
      }

      case 'custom': {
        if (!startDate || !endDate) {
          return errorResponse(
            res,
            'startDate and endDate are required for custom period',
            400
          );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start) || isNaN(end)) {
          return errorResponse(res, 'Invalid date format. Use YYYY-MM-DD', 400);
        }

        // Start: 00:00:00 UTC, End: 23:59:59.999 UTC
        const startUTC = new Date(
          Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
        );
        const endUTC = new Date(
          Date.UTC(
            end.getFullYear(),
            end.getMonth(),
            end.getDate(),
            23,
            59,
            59,
            999
          )
        );

        dateFilter = {
          date: { $gte: startUTC, $lte: endUTC },
        };
        break;
      }

      case 'all':
      default:
        dateFilter = {};
        break;
    }

    // Build final query
    const query = { userId, ...dateFilter };
    if (source && source.toString().trim()) {
      query.source = source.toString().trim();
    }

    // Fetch incomes
    const incomes = await Income.find(query).sort({ date: -1 }).lean();

    const formattedIncomes = incomes.map((inc) => ({
      ...inc,
      date: new Date(inc.date).toISOString().split('T')[0], // YYYY-MM-DD
    }));

    const totalAmount = formattedIncomes.reduce(
      (sum, inc) => sum + (inc.amount || 0),
      0
    );

    // Helper
    const format = (date) =>
      date ? new Date(date).toISOString().split('T')[0] : null;

    const searchStartDate = dateFilter.date?.$gte || null;
    const searchEndDate = dateFilter.date?.$lte || format(now);

    successResponse(res, {
      incomes: formattedIncomes,
      count: formattedIncomes.length,
      totalAmount,
      period: activePeriod,
      source: source?.toString().trim() || 'all sources',
      searchStartDate: format(searchStartDate),
      searchEndDate: format(searchEndDate),
      dateRange:
        searchStartDate && searchEndDate
          ? `${format(searchStartDate)} to ${format(searchEndDate)}`
          : 'All time',
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
