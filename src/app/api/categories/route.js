import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');

    const visibilityFilter = { $or: [{ userId: null }, { userId }] };

    const [topLevel, subCategories] = await Promise.all([
      Category.find({ ...visibilityFilter, parentCategoryId: null }).sort({ isDefault: -1, name: 1 }),
      Category.find({ ...visibilityFilter, parentCategoryId: { $ne: null } }).sort({ name: 1 })
    ]);

    // Build parentId → subcategory[] map
    const subMap = new Map();
    for (const sub of subCategories) {
      const key = sub.parentCategoryId.toString();
      if (!subMap.has(key)) subMap.set(key, []);
      subMap.get(key).push(sub);
    }

    // Attach subCategories array to each top-level category, inheriting color for subs
    const categories = topLevel.map(cat => {
      const catObj = cat.toObject();
      const subs = (subMap.get(cat._id.toString()) || []).map(sub => {
        const s = sub.toObject();
        if (!s.color) s.color = cat.color;
        return s;
      });
      catObj.subCategories = subs;
      return catObj;
    });

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
    const { name, icon, color, parentCategoryId } = await req.json();

    if (!name || !icon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Subcategory — verify parent exists
    const parent = await Category.findById(parentCategoryId);
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

export async function PUT(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { categoryId, name, icon, color } = await req.json();

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    }

    const category = await Category.findById(categoryId);
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (category.isDefault) {
      return NextResponse.json({ error: 'Cannot edit default categories' }, { status: 403 });
    }
    if (category.userId?.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;

    const updated = await Category.findByIdAndUpdate(categoryId, { $set: updates }, { new: true });
    return NextResponse.json({ category: updated }, { status: 200 });
  } catch (error) {
    console.error('Category PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    }

    const category = await Category.findById(categoryId);
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (category.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default categories' }, { status: 403 });
    }
    if (category.userId?.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If top-level, also delete user-owned subcategories under it
    if (!category.parentCategoryId) {
      await Category.deleteMany({
        parentCategoryId: category._id,
        userId,
        isDefault: false
      });
    }

    await Category.findByIdAndDelete(categoryId);
    return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Category DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
