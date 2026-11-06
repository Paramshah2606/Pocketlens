import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Budget from '@/models/Budget';
import Expense from '@/models/Expense';
import '@/models/Category'; // registers the model used by populate()
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Aggregate expenses for the current month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const [budgets, expensesAgg] = await Promise.all([
      Budget.find({ userId, period: 'monthly', month: currentMonth, year: currentYear })
        .populate('categoryId', 'name icon color')
        .lean(),
      // aggregate() does not cast types, so userId must be an ObjectId here
      Expense.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$categoryId", totalSpent: { $sum: "$amount" } } }
      ]),
    ]);

    const spentByCategory = new Map(expensesAgg.map(e => [e._id.toString(), e.totalSpent]));

    // Map spent amounts to budgets (skip budgets whose category was deleted)
    const budgetStats = budgets
      .filter(budget => budget.categoryId)
      .map(budget => {
        const spent = spentByCategory.get(budget.categoryId._id.toString()) || 0;
        return {
          ...budget,
          spent,
          percentageUsed: (spent / budget.amount) * 100
        };
      });

    return NextResponse.json({ budgets: budgetStats }, { status: 200 });
  } catch (error) {
    console.error('Budgets GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { categoryId, amount, period = 'monthly', month, year } = await req.json();

    if (!categoryId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const budget = await Budget.findOneAndUpdate(
      { userId, categoryId, period, month: targetMonth, year: targetYear },
      { amount },
      { new: true, upsert: true }
    ).populate('categoryId', 'name icon color');

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error('Budget POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
