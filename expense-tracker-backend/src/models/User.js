import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  currency: { type: String, default: 'BDT' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);