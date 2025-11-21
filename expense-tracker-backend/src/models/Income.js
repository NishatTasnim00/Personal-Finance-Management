// src/models/Income.js
import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: [true, 'Source is required'],
      trim: true,
      maxlength: 100,
    },
    icon: {
      type: String,
      default: null,
      maxlength: 10, // emoji or short text
    },
    color: {
      type: String,
      default: '',
      match: /^#[0-9A-Fa-f]{6}$/, // valid hex color
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for performance
incomeSchema.index({ userId: 1, date: -1 });

export default mongoose.model('Income', incomeSchema);