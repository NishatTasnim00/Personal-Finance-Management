// src/controllers/savingsGoalController.js
import SavingsGoal from '../models/SavingsGoal.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const getUserId = (req) => req.user?.uid || req.user?.id || req.user?.sub;

export const createGoal = async (req, res) => {
  try {
    const {
      title, targetAmount, deadline, icon, color,
      recurring, recurringAmount, recurringFrequency
    } = req.body;

    const goal = await SavingsGoal.create({
      userId: getUserId(req),
      title: title.trim(),
      targetAmount: Number(targetAmount),
      deadline: deadline || null,
      icon: icon || 'Target',
      color: color || '#10b981',
      recurring: !!recurring,
      recurringAmount: recurring ? Number(recurringAmount) || 0 : 0,
      recurringFrequency: recurring ? recurringFrequency : 'monthly',
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
      .sort({ createdAt: -1 });
    successResponse(res, goals);
  } catch (err) {
    errorResponse(res, 'Server error', 500);
  }
};

export const updateGoal = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.recurring === false) {
      updates.recurringAmount = 0;
      updates.lastContributed = null;
    }
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: getUserId(req) },
      updates,
      { new: true, runValidators: true }
    );
    if (!goal) return errorResponse(res, 'Goal not found', 404);
    successResponse(res, goal);
  } catch (err) {
    errorResponse(res, err.message || 'Failed to update', 500);
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      userId: getUserId(req),
    });
    if (!goal) return errorResponse(res, 'Goal not found', 404);
    successResponse(res, null, 200, 'Goal deleted');
  } catch (err) {
    errorResponse(res, 'Server error', 500);
  }
};

export const addToGoal = async (req, res) => {
  try {
    const { amount } = req.body;
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: getUserId(req) },
      { $inc: { currentAmount: Number(amount) } },
      { new: true }
    );
    if (!goal) return errorResponse(res, 'Goal not found', 404);
    successResponse(res, goal);
  } catch (err) {
    errorResponse(res, 'Failed to add amount', 500);
  }
};