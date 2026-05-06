import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');

    // Fetch default categories and user-specific categories
    const categories = await Category.find({
      $or: [{ userId: null }, { userId }]
    }).sort({ name: 1 });

    const uniqueCategoriesMap = new Map();
    categories.forEach(cat => {
      const existing = uniqueCategoriesMap.get(cat.name);
      if (!existing || (existing.isDefault && !cat.isDefault)) {
        uniqueCategoriesMap.set(cat.name, cat);
      }
    });

    return NextResponse.json({ categories: Array.from(uniqueCategoriesMap.values()) }, { status: 200 });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { name, icon, color, subCategories } = await req.json();

    if (!name || !icon || !color) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newCategory = await Category.create({
      userId,
      name,
      icon,
      color,
      subCategories: subCategories || [],
      isDefault: false
    });

    return NextResponse.json({ category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Category POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { categoryId, newSubCategory } = await req.json();

    if (!categoryId || !newSubCategory || !newSubCategory.name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const category = await Category.findById(categoryId);
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (category.isDefault) {
      // Create a user-specific clone with the new subcategory
      const clonedCategory = await Category.create({
        userId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        subCategories: [...category.subCategories, newSubCategory],
        isDefault: false
      });
      return NextResponse.json({ category: clonedCategory }, { status: 201 });
    } else {
      // Update existing user category
      category.subCategories.push(newSubCategory);
      await category.save();
      return NextResponse.json({ category }, { status: 200 });
    }
  } catch (error) {
    console.error('Category PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
