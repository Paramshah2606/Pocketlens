import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import Expense from '@/models/Expense';

// One-time cleanup: removes user-specific top-level categories that are clones of default
// categories (created by the old "clone on subcategory add" logic). Re-parents their
// subcategories to the matching default category and fixes all expense references.
// Safe to run multiple times.
export async function GET() {
  try {
    await dbConnect();

    // All default top-level categories (the canonical ones)
    const defaultCategories = await Category.find({ userId: null, parentCategoryId: null, isDefault: true });
    const defaultByName = new Map(defaultCategories.map(c => [c.name.toLowerCase(), c]));

    // All user-specific top-level categories that share a name with a default
    const clones = await Category.find({ userId: { $ne: null }, parentCategoryId: null, isDefault: false });

    let categoriesMerged = 0;
    let subcategoriesReparented = 0;
    let expensesUpdated = 0;

    for (const clone of clones) {
      const defaultCat = defaultByName.get(clone.name.toLowerCase());
      if (!defaultCat) continue; // genuinely user-created category, skip

      // Re-parent subcategories from clone → default
      const result = await Category.updateMany(
        { parentCategoryId: clone._id },
        { $set: { parentCategoryId: defaultCat._id } }
      );
      subcategoriesReparented += result.modifiedCount;

      // Fix expense references: categoryId pointing to clone → default
      const expResult = await Expense.updateMany(
        { categoryId: clone._id },
        { $set: { categoryId: defaultCat._id } }
      );
      expensesUpdated += expResult.modifiedCount;

      await Category.findByIdAndDelete(clone._id);
      categoriesMerged++;
    }

    return NextResponse.json({
      message: 'Cleanup complete',
      categoriesMerged,
      subcategoriesReparented,
      expensesUpdated
    }, { status: 200 });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed', detail: error.message }, { status: 500 });
  }
}
