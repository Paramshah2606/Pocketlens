import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

// WARNING: Do NOT run this on a live database that already has expense data.
// Re-seeding creates new default category _id values, which will break existing
// Expense.categoryId references. Only use on a fresh database or after a full reset.
export async function GET() {
  try {
    await dbConnect();

    // Clear existing default categories (top-level and subcategories)
    await Category.deleteMany({ userId: null });

    const defaultCategories = [
      {
        name: "Food & Dining",
        icon: "🍔",
        color: "#f59e0b",
        subCategories: [
          { name: "Groceries", icon: "🛒" },
          { name: "Restaurants", icon: "🍽️" },
          { name: "Coffee", icon: "☕" }
        ]
      },
      {
        name: "Transport",
        icon: "🚗",
        color: "#3b82f6",
        subCategories: [
          { name: "Public Transit", icon: "🚌" },
          { name: "Fuel", icon: "⛽" },
          { name: "Taxi/Uber", icon: "🚕" }
        ]
      },
      {
        name: "Housing",
        icon: "🏠",
        color: "#10b981",
        subCategories: [
          { name: "Rent/Mortgage", icon: "🔑" },
          { name: "Utilities", icon: "⚡" },
          { name: "Maintenance", icon: "🔧" }
        ]
      },
      {
        name: "Personal",
        icon: "🛍️",
        color: "#8b5cf6",
        subCategories: [
          { name: "Clothing", icon: "👕" },
          { name: "Entertainment", icon: "🎬" },
          { name: "Subscriptions", icon: "📱" }
        ]
      }
    ];

    for (const entry of defaultCategories) {
      const parent = await Category.create({
        userId: null,
        name: entry.name,
        icon: entry.icon,
        color: entry.color,
        parentCategoryId: null,
        isDefault: true
      });

      for (const sub of entry.subCategories) {
        await Category.create({
          userId: null,
          name: sub.name,
          icon: sub.icon,
          color: null,
          parentCategoryId: parent._id,
          isDefault: true
        });
      }
    }

    return NextResponse.json({ message: "Seeded default categories successfully!" }, { status: 200 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
