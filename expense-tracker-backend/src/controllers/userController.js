import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select('-__v -password');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, user);
  } catch (err) {
    console.error('getProfile error:', err);
    errorResponse(res, 'Server error', 500);
  }
};

export const updateProfile = async (req, res) => {
  const updates = req.body;

  // Prevent updating sensitive fields
  const disallowedFields = ['uid', 'email', 'role', 'createdAt', 'updatedAt', 'password'];
  for (const field of disallowedFields) {
    delete updates[field];
  }

  // Always set updatedAt
  updates.updatedAt = new Date();

  // Optional: Allow only specific fields
  const allowedFields = ['name', 'age', 'profession', 'phone', 'currency', 'theme', 'avatar', 'bio', 'monthlyGoal'];
  const filteredUpdates = Object.keys(updates)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updates[key];
      return obj;
    }, {});

  if (Object.keys(filteredUpdates).length === 0) {
    return errorResponse(res, 'No valid fields to update', 400);
  }

  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: filteredUpdates },
      { new: true, runValidators: true, select: '-__v -password' }
    );

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, user, 200, 'Profile updated successfully');
  } catch (err) {
    console.error('updateProfile error:', err);

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message).join(', ');
      return errorResponse(res, errors, 400);
    }

    errorResponse(res, err.message || 'Failed to update profile', 400);
  }
};

export const uploadAvatar = async (req, res) => {
  // Best practice: Let frontend upload to Firebase Storage directly
  // Then save the download URL here
  successResponse(
    res,
    { message: 'Upload avatar using Firebase Storage client-side, then call updateProfile with the URL' },
    200
  );
};

// Bonus: If you ever want a dedicated endpoint to save avatar URL
export const updateAvatar = async (req, res) => {
  const { avatarUrl } = req.body;

  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return errorResponse(res, 'Valid avatar URL is required', 400);
  }

  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: { avatar: avatarUrl, updatedAt: new Date() } },
      { new: true, select: 'avatar name email' }
    );

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, { avatar: user.avatar }, 200, 'Avatar updated');
  } catch (err) {
    console.error('updateAvatar error:', err);
    errorResponse(res, 'Failed to update avatar', 500);
  }
};