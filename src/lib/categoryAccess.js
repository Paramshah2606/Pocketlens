import Category from '@/models/Category';
import { isObjectId } from '@/lib/validate';

// Categories a user can see: shared defaults (userId null) + their own
export const visibleTo = (userId) => ({ $or: [{ userId: null }, { userId }] });

// Checks that categoryId is a top-level category the user can see and, if given, that
// subCategoryId is a sub-category of it. Prevents expenses/budgets from pointing at
// another user's private categories (which would leak their names via populate).
// Returns { error } or { categoryId, subCategoryId }.
export async function resolveCategory(userId, categoryId, subCategoryId) {
  if (!isObjectId(categoryId)) return { error: 'Please choose a category' };

  const category = await Category.findOne({ _id: categoryId, parentCategoryId: null, ...visibleTo(userId) })
    .select('_id')
    .lean();
  if (!category) return { error: 'Category not found' };

  if (subCategoryId === undefined || subCategoryId === null || subCategoryId === '') {
    return { categoryId: category._id, subCategoryId: null };
  }
  if (!isObjectId(subCategoryId)) return { error: 'Sub-category not found' };

  const sub = await Category.findOne({ _id: subCategoryId, parentCategoryId: category._id, ...visibleTo(userId) })
    .select('_id')
    .lean();
  if (!sub) return { error: 'Sub-category not found' };

  return { categoryId: category._id, subCategoryId: sub._id };
}
