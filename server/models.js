
import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },

  share: {
    type: Number,
    required: true,
    min: 0.01,
    validate: {
      validator: value =>
        Number.isFinite(value) &&
        Math.round(value * 100) === value * 100,
      message: 'Share must have no more than two decimal places.'
    }
  },

  is_paid: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  _id: false
});

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  paid_by: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },

  // Legacy field, retained for existing expenses
  owed_by: {
    type: String,
    required: false,
    trim: true,
    maxlength: 50
  },

  participants: {
    type: [participantSchema],
    default: undefined
  },

  amount: {
    type: Number,
    required: true,
    min: 0.01,
    validate: {
      validator: value =>
        Number.isFinite(value) &&
        Math.round(value * 100) === value * 100,
      message: 'Amount must have no more than two decimal places.'
    }
  },

  date: {
    type: Date,
    required: true
  },

  // Legacy field, retained for existing expenses
  is_paid: {
    type: Boolean,
    required: false,
    default: undefined
  }
}, {
  collection: 'expenses',
  timestamps: true,
  autoIndex: false
});

export const Expense =
  mongoose.models.Expense || mongoose.model('Expense', expenseSchema);