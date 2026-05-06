import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['monthly', 'weekly'], default: 'monthly' },
  month: { type: Number }, // 1-12
  year: { type: Number }
}, { timestamps: true });

const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
export default Budget;
