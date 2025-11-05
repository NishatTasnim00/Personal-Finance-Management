// backend/src/controllers/userController.js
import User from '../models/User.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  const updates = req.body;
  updates.updatedAt = new Date();

  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const uploadAvatar = async (req, res) => {
  // We'll handle this in frontend with Firebase Storage
  res.status(501).json({ message: 'Use Firebase Storage directly' });
};