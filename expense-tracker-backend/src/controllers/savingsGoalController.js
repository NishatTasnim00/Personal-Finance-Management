import SavingsGoal from '../models/SavingsGoal.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const getUserId = (req) => req.user?.uid || req.user?.id || req.user?.sub;

export const createGoal = async (req, res) => {
  try {
    const {
      title, targetAmount, currentAmount, deadline, icon, color,
      recurring, recurringAmount, recurringFrequency
    } = req.body;

    if (!title || !title.trim()) {
      return errorResponse(res, 'Title is required', 400);
    }

    if (!targetAmount || targetAmount <= 0) {
      return errorResponse(res, 'Target amount must be greater than 0', 400);
    }

    const current = currentAmount || 0;
    if (current < 0) {
      return errorResponse(res, 'Current amount cannot be negative', 400);
    }

    if (current > targetAmount) {
      return errorResponse(res, 'Current amount cannot exceed target amount', 400);
    }

    if (deadline && new Date(deadline) < new Date()) {
      return errorResponse(res, 'Deadline must be in the future', 400);
    }

    if (recurring && (!recurringAmount || recurringAmount <= 0)) {
      return errorResponse(res, 'Recurring amount is required when recurring is enabled', 400);
    }

    const goal = await SavingsGoal.create({
      userId: getUserId(req),
      title: title.trim(),
      targetAmount: Number(targetAmount),
      currentAmount: Number(current),
      deadline: deadline ? new Date(deadline) : null,
      icon: icon || '🎯',
      color: color || '#10b981',
      recurring: !!recurring,
      recurringAmount: recurring ? Number(recurringAmount) : 0,
      recurringFrequency: recurring ? (recurringFrequency || 'monthly') : 'monthly',
      lastContributed: recurring ? new Date() : null,
    });

    successResponse(res, goal, 201);
  } catch (err) {
    errorResponse(res, err.message || 'Failed to create goal', 500);
  }
};

export const getGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ userId: getUserId(req) })
      .sort({ createdAt: -1 })
      .lean();
    
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progress: goal.targetAmount > 0 
        ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
        : 0
    }));

    successResponse(res, goalsWithProgress);
  } catch (err) {
    errorResponse(res, 'Server error', 500);
  }
};

export const updateGoal = async (req, res) => {
  try {
    const updates = req.body;
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: getUserId(req) });
    
    if (!goal) {
      return errorResponse(res, 'Goal not found', 404);
    }

    if (updates.title !== undefined && (!updates.title || !updates.title.trim())) {
      return errorResponse(res, 'Title is required', 400);
    }

    if (updates.targetAmount !== undefined) {
      if (updates.targetAmount <= 0) {
        return errorResponse(res, 'Target amount must be greater than 0', 400);
      }
      if (goal.currentAmount > updates.targetAmount) {
        return errorResponse(res, 'Target amount cannot be less than current amount', 400);
      }
    }

    if (updates.currentAmount !== undefined) {
      const newCurrent = Number(updates.currentAmount);
      if (newCurrent < 0) {
        return errorResponse(res, 'Current amount cannot be negative', 400);
      }
      const target = updates.targetAmount !== undefined ? Number(updates.targetAmount) : goal.targetAmount;
      if (newCurrent > target) {
        return errorResponse(res, 'Current amount cannot exceed target amount', 400);
      }
    }

    if (updates.deadline && new Date(updates.deadline) < new Date()) {
      return errorResponse(res, 'Deadline must be in the future', 400);
    }

    if (updates.recurring === false) {
      updates.recurringAmount = 0;
      updates.lastContributed = null;
    } else if (updates.recurring && (!updates.recurringAmount || updates.recurringAmount <= 0)) {
      return errorResponse(res, 'Recurring amount is required when recurring is enabled', 400);
    }

    const updatedGoal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: getUserId(req) },
      updates,
      { new: true, runValidators: true }
    );

    successResponse(res, updatedGoal);
  } catch (err) {
    errorResponse(res, err.message || 'Failed to update goal', 500);
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      userId: getUserId(req),
    });
    
    if (!goal) {
      return errorResponse(res, 'Goal not found', 404);
    }
    
    successResponse(res, null, 200, 'Goal deleted successfully');
  } catch (err) {
    errorResponse(res, err.message || 'Server error', 500);
  }
};

export const addToGoal = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return errorResponse(res, 'Amount must be greater than 0', 400);
    }

    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: getUserId(req) });
    
    if (!goal) {
      return errorResponse(res, 'Goal not found', 404);
    }

    const newAmount = goal.currentAmount + Number(amount);
    
    if (newAmount > goal.targetAmount) {
      return errorResponse(res, `Amount exceeds remaining target. Maximum allowed: ৳${(goal.targetAmount - goal.currentAmount).toLocaleString()}`, 400);
    }

    const updatedGoal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: getUserId(req) },
      { 
        $inc: { currentAmount: Number(amount) },
        $set: { lastContributed: new Date() }
      },
      { new: true }
    );

    successResponse(res, updatedGoal, 200, 'Amount added successfully');
  } catch (err) {
    errorResponse(res, err.message || 'Failed to add amount', 500);
  }
};
