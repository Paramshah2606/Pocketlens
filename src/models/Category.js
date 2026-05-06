import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  name: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, default: null },
  parentCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
export default Category;
