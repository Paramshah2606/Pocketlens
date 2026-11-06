import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true },
  notes: { type: String, trim: true },
  date: { type: Date, required: true, index: true }
}, { timestamps: true });

// Every list/summary query filters by user (+ date range or category)
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, categoryId: 1, date: -1 });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
export default Expense;
