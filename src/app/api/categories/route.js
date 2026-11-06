import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import Expense from '@/models/Expense';
import Budget from '@/models/Budget';
import { visibleTo } from '@/lib/categoryAccess';
import { cleanString, cleanEmoji } from '@/lib/validate';

const COLOR_RE = /^#[0-9a-f]{6}$/i;
const cleanName = (v) => cleanString(v, { max: 40 });
// Icons must be a single emoji (picked from the emoji picker)
const cleanIcon = (v) => cleanEmoji(v);

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');

    const [topLevel, subCategories] = await Promise.all([
      Category.find({ ...visibleTo(userId), parentCategoryId: null }).sort({ isDefault: -1, name: 1 }).lean(),
      Category.find({ ...visibleTo(userId), parentCategoryId: { $ne: null } }).sort({ name: 1 }).lean()
    ]);

    // Build parentId → subcategory[] map
    const subMap = new Map();
    for (const sub of subCategories) {
      const key = sub.parentCategoryId.toString();
      if (!subMap.has(key)) subMap.set(key, []);
      subMap.get(key).push(sub);
    }

    // Attach subCategories array to each top-level category, inheriting color for subs
    const categories = topLevel.map(cat => ({
      ...cat,
      subCategories: (subMap.get(cat._id.toString()) || []).map(sub => ({ ...sub, color: sub.color || cat.color })),
    }));

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const body = await req.json().catch(() => ({}));
    const { color, parentCategoryId } = body;
    const name = cleanName(body.name);
    const icon = cleanIcon(body.icon);

    if (!name || !icon) {
      return NextResponse.json({ error: !name ? 'Name is required (max 40 characters)' : 'Please choose an emoji as the icon' }, { status: 400 });
    }
    if (color !== undefined && color !== null && !(typeof color === 'string' && COLOR_RE.test(color))) {
      return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    }

    if (!parentCategoryId) {
      // Top-level category requires a color
      if (!color) {
        return NextResponse.json({ error: 'color is required for top-level categories' }, { status: 400 });
      }
      const newCategory = await Category.create({
        userId,
        name,
        icon,
        color,
        parentCategoryId: null,
        isDefault: false
      });
      return NextResponse.json({ category: newCategory }, { status: 201 });
    }

    // Subcategory: parent must be a top-level category this user can see
    if (typeof parentCategoryId !== 'string' || !mongoose.isValidObjectId(parentCategoryId)) {
      return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
    }
    const parent = await Category.findOne({ _id: parentCategoryId, parentCategoryId: null, ...visibleTo(userId) });
    if (!parent) {
      return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
    }

    const newSubCategory = await Category.create({
      userId,
      name,
      icon,
      color: color || null,
      parentCategoryId,
      isDefault: false
    });
    return NextResponse.json({ category: newSubCategory }, { status: 201 });
  } catch (error) {
    console.error('Category POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Loads a category and checks the user may change it (own, non-default)
async function findEditable(categoryId, userId) {
  if (typeof categoryId !== 'string' || !mongoose.isValidObjectId(categoryId)) {
    return { error: NextResponse.json({ error: 'categoryId is required' }, { status: 400 }) };
  }
  const category = await Category.findById(categoryId);
  if (!category) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  if (category.isDefault || !category.userId) {
    return { error: NextResponse.json({ error: 'Default categories cannot be changed' }, { status: 403 }) };
  }
  if (category.userId.toString() !== userId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { category };
}

export async function PUT(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { categoryId, name, icon, color } = await req.json().catch(() => ({}));

    const { category, error } = await findEditable(categoryId, userId);
    if (error) return error;

    const updates = {};
    if (name !== undefined) {
      const value = cleanName(name);
      if (!value) return NextResponse.json({ error: 'Name must be 1–40 characters' }, { status: 400 });
      updates.name = value;
    }
    if (icon !== undefined) {
      const value = cleanIcon(icon);
      if (!value) return NextResponse.json({ error: 'Please choose an emoji as the icon' }, { status: 400 });
      updates.icon = value;
    }
    if (color !== undefined) {
      if (!(typeof color === 'string' && COLOR_RE.test(color))) {
        return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
      }
      updates.color = color;
    }

    const updated = await Category.findByIdAndUpdate(category._id, { $set: updates }, { new: true });
    return NextResponse.json({ category: updated }, { status: 200 });
  } catch (error) {
    console.error('Category PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/categories?categoryId=...[&moveTo=otherCategoryId]
// - Sub-category: its expenses stay in the parent category, just without a sub-category.
// - Top-level category with expenses: requires moveTo, and those expenses are moved there.
//   Returns 409 { expenseCount } when moveTo is missing so the UI can ask the user.
export async function DELETE(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const moveTo = searchParams.get('moveTo');

    const { category, error } = await findEditable(categoryId, userId);
    if (error) return error;

    if (category.parentCategoryId) {
      await Expense.updateMany({ userId, subCategoryId: category._id }, { $unset: { subCategoryId: 1 } });
      await Category.deleteOne({ _id: category._id });
      return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
    }

    const expenseCount = await Expense.countDocuments({ userId, categoryId: category._id });

    if (expenseCount > 0) {
      if (!moveTo) {
        return NextResponse.json({
          error: 'This category has expenses. Choose a category to move them to.',
          expenseCount
        }, { status: 409 });
      }
      if (typeof moveTo !== 'string' || !mongoose.isValidObjectId(moveTo) || moveTo === categoryId) {
        return NextResponse.json({ error: 'Invalid target category' }, { status: 400 });
      }
      const target = await Category.findOne({ _id: moveTo, parentCategoryId: null, ...visibleTo(userId) });
      if (!target) {
        return NextResponse.json({ error: 'Target category not found' }, { status: 404 });
      }
      // Sub-categories belong to the old category, so moved expenses lose theirs
      await Expense.updateMany(
        { userId, categoryId: category._id },
        { $set: { categoryId: target._id }, $unset: { subCategoryId: 1 } }
      );
    }

    await Promise.all([
      Budget.deleteMany({ userId, categoryId: category._id }),
      Category.deleteMany({ parentCategoryId: category._id, userId, isDefault: false }),
    ]);
    await Category.deleteOne({ _id: category._id });

    return NextResponse.json({ message: 'Deleted successfully', movedExpenses: expenseCount }, { status: 200 });
  } catch (error) {
    console.error('Category DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
