import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import mongoose from 'mongoose';

// One-time idempotent migration: promotes embedded subCategories to flat Category documents.
// Preserves the original embedded subdoc _id values so existing Expense.subCategoryId
// references remain valid without touching any Expense documents.
// Safe to run multiple times.
export async function GET() {
  try {
    await dbConnect();

    // Use raw MongoDB driver to read subCategories field (Mongoose schema no longer declares it)
    const db = mongoose.connection.db;
    const rawCategories = await db.collection('categories')
      .find({ subCategories: { $exists: true, $not: { $size: 0 } } })
      .toArray();

    let parentsProcessed = 0;
    let subcategoriesCreated = 0;
    let skipped = 0;

    for (const parent of rawCategories) {
      parentsProcessed++;
      const subs = parent.subCategories || [];

      for (const sub of subs) {
        const exists = await Category.findById(sub._id);
        if (exists) {
          skipped++;
          continue;
        }

        await Category.create({
          _id: sub._id,
          userId: parent.userId ?? null,
          name: sub.name,
          icon: sub.icon || '✨',
          color: null,
          parentCategoryId: parent._id,
          isDefault: parent.isDefault ?? false
        });
        subcategoriesCreated++;
      }
    }

    // Strip the subCategories array from all parent documents
    await db.collection('categories').updateMany(
      { subCategories: { $exists: true } },
      { $unset: { subCategories: '' } }
    );

    return NextResponse.json({
      message: 'Migration complete',
      parentsProcessed,
      subcategoriesCreated,
      skipped
    }, { status: 200 });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', detail: error.message }, { status: 500 });
  }
}
