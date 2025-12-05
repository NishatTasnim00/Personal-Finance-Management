import Expense from "../models/Expense.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const getUserId = (req) => req.user.uid || req.user.id || req.user.sub;

export const createExpense = async (req, res) => {
  try {
    const {
      category,
      icon,
      color,
      description,
      amount,
      date,
      recurring,
      recurringFrequency,
    } = req.body;

    if (!category || !amount || !date) {
      const missing = [];

      if (!category) missing.push("Category");
      if (!amount) missing.push("Amount");
      if (!date) missing.push("Date");

      const fieldWord = missing.length > 1 ? "fields are" : "field is";
      const message = `${missing.join(", ")} ${fieldWord} required`;

      return errorResponse(res, message, 400);
    }

    const expense = await Expense.create({
      category: category.trim(),
      icon: icon?.trim(),
      color: color?.trim(),
      description: description?.trim(),
      amount: Number(amount),
      date: new Date(date),
      recurring: recurring === true || recurring === "true",
      recurringFrequency: recurring ? recurringFrequency || "monthly" : null,
      userId: getUserId(req),
    });

    const responseData = {
      id: expense._id,
      category: expense.category,
      icon: expense.icon,
      color: expense.color,
      description: expense.description,
      amount: expense.amount,
      date: expense.date.toISOString().split("T")[0],
      recurring: expense.recurring,
      recurringFrequency: expense.recurringFrequency,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };

    successResponse(res, responseData, 201, "Expense added successfully");
  } catch (err) {
    console.error("createExpense error:", err);
    errorResponse(res, err.message || "Failed to add expense", 500);
  }
};

export const getExpenses = async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      period = "all",
      startDate,
      endDate,
      category,
      recurring,
    } = req.query;

    let activePeriod = period.toString().trim().toLowerCase();
    if (startDate && endDate) {
      activePeriod = "custom";
    }

    let dateFilter = {};
    const now = new Date();

    switch (activePeriod) {
      case "today": {
        const startOfDay = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        );
        dateFilter = { date: { $gte: startOfDay } };
        break;
      }
      case "week": {
        const day = now.getUTCDay();
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
      case "month": {
        const startOfMonth = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
        );
        dateFilter = { date: { $gte: startOfMonth } };
        break;
      }
      case "year": {
        const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        dateFilter = { date: { $gte: startOfYear } };
        break;
      }
      case "custom": {
        if (!startDate || !endDate) {
          return errorResponse(
            res,
            "startDate and endDate are required for custom period",
            400
          );
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start) || isNaN(end)) {
          return errorResponse(res, "Invalid date format. Use YYYY-MM-DD", 400);
        }
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

        dateFilter = { date: { $gte: startUTC, $lte: endUTC } };
        break;
      }
      case "all":
      default:
        dateFilter = {};
        break;
    }

    const query = { userId, ...dateFilter };

    if (category && category.toString().trim()) {
      query.category = category.toString().trim();
    }

    if (recurring !== undefined) {
      const isRecurring = recurring === "true" || recurring === true;
      query.recurring = isRecurring;
    }

    const expenses = await Expense.find(query).sort({ date: -1 }).lean();

    const formattedExpenses = expenses.map((exp) => ({
      ...exp,
      date: new Date(exp.date).toISOString().split("T")[0],
    }));

    const totalAmount = formattedExpenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );

    const format = (date) =>
      date ? new Date(date).toISOString().split("T")[0] : null;
    const searchStartDate = dateFilter.date?.$gte || null;
    const searchEndDate = dateFilter.date?.$lte || format(now);

    successResponse(res, {
      expenses: formattedExpenses,
      count: formattedExpenses.length,
      totalAmount,
      period: activePeriod,
      category: category?.toString().trim() || "all types",
      recurring: recurring !== undefined ? recurring === "true" : "all",
      searchStartDate: format(searchStartDate),
      searchEndDate: format(searchEndDate),
      dateRange:
        searchStartDate && searchEndDate
          ? `${format(searchStartDate)} to ${format(searchEndDate)}`
          : "All time",
    });
  } catch (err) {
    console.error("getExpenses error:", err);
    errorResponse(res, "Server error", 500);
  }
};

export const updateExpense = async (req, res) => {
  try {
    const {
      category,
      icon,
      color,
      description,
      amount,
      date,
      recurring,
      recurringFrequency,
    } = req.body;

    const updateData = {
      category: category?.trim(),
      icon: icon?.trim(),
      color: color?.trim(),
      description: description?.trim(),
      amount: amount !== undefined ? Number(amount) : undefined,
      date: date ? new Date(date) : undefined,
      recurring:
        recurring !== undefined
          ? recurring === true || recurring === "true"
          : undefined,
    };

    if (recurring !== undefined) {
      updateData.recurringFrequency =
        recurring === true || recurring === "true"
          ? recurringFrequency || "monthly"
          : null;
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: getUserId(req) },
      updateData,
      { new: true, runValidators: true }
    ).select("-userId -__v");

    if (!expense) {
      return errorResponse(res, "Expense not found", 404);
    }

    const formatted = {
      id: expense._id,
      category: expense.category,
      icon: expense.icon,
      color: expense.color,
      description: expense.description,
      amount: expense.amount,
      date: expense.date.toISOString().split("T")[0],
      recurring: expense.recurring,
      recurringFrequency: expense.recurringFrequency,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };

    successResponse(res, formatted, 200, "Expense updated");
  } catch (err) {
    console.error("updateExpense error:", err);
    errorResponse(res, err.message || "Failed to update expense", 500);
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: getUserId(req),
    });

    if (!expense) {
      return errorResponse(res, "Expense not found", 404);
    }

    successResponse(res, null, 200, "Expense deleted successfully");
  } catch (err) {
    console.error("deleteExpense error:", err);
    errorResponse(res, "Server error", 500);
  }
};
