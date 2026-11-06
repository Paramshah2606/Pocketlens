import mongoose from 'mongoose';
import { INCOME_SOURCE_IDS } from '@/lib/incomeSources';

const incomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  source: { type: String, enum: INCOME_SOURCE_IDS, default: 'salary' },
  description: { type: String, trim: true },
  date: { type: Date, required: true }
}, { timestamps: true });

// Every query filters by user and a date range, newest first
incomeSchema.index({ userId: 1, date: -1 });

const Income = mongoose.models.Income || mongoose.model('Income', incomeSchema);
export default Income;
