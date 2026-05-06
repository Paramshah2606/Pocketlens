import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

export async function GET() {
  try {
    await dbConnect();
    
    // Clear existing default categories
    await Category.deleteMany({ userId: null });
    
    const defaultCategories = [
      {
        name: "Food & Dining",
        icon: "🍔",
        color: "#f59e0b",
        isDefault: true,
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
        isDefault: true,
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
        isDefault: true,
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
        isDefault: true,
        subCategories: [
          { name: "Clothing", icon: "👕" },
          { name: "Entertainment", icon: "🎬" },
          { name: "Subscriptions", icon: "📱" }
        ]
      }
    ];

    await Category.insertMany(defaultCategories);

    return NextResponse.json({ message: "Seeded default categories successfully!" }, { status: 200 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
