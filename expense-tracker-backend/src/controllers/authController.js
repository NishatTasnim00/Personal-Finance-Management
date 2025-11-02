import User from '../models/User.js';

export const registerUser = async (req, res) => {
  const { uid, email, name } = req.body;
  try {
    let user = await User.findOne({ uid });
    if (user) return res.status(200).json(user);

    user = new User({ uid, email, name });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};