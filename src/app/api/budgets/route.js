import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Budget from '@/models/Budget';
import Expense from '@/models/Expense';
import '@/models/Category'; // registers the model used by populate()
import { resolveCategory } from '@/lib/categoryAccess';
import { isObjectId, parseAmount } from '@/lib/validate';

// Budgets are monthly. The browser sends its own month (?month=YYYY-MM) so the
// "current month" matches the user's calendar rather than the server's timezone.
function targetMonth(value) {
  const m = /^(\d{4})-(\d{2})$/.exec(typeof value === 'string' ? value : '');
  if (m && +m[2] >= 1 && +m[2] <= 12) return { year: +m[1], month: +m[2] };
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const { year, month } = targetMonth(searchParams.get('month'));

    // Expense dates are stored at UTC midnight
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const [budgets, expensesAgg] = await Promise.all([
      Budget.find({ userId, period: 'monthly', month, year })
        .populate('categoryId', 'name icon color')
        .lean(),
      // aggregate() does not cast types, so userId must be an ObjectId here
      Expense.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startDate, $lt: endDate } } },
        { $group: { _id: "$categoryId", totalSpent: { $sum: "$amount" } } }
      ]),
    ]);

    const spentByCategory = new Map(expensesAgg.map(e => [e._id.toString(), e.totalSpent]));

    // Map spent amounts to budgets (skip budgets whose category was deleted)
    const budgetStats = budgets
      .filter(budget => budget.categoryId)
      .map(budget => {
        const spent = spentByCategory.get(budget.categoryId._id.toString()) || 0;
        return { ...budget, spent, percentageUsed: (spent / budget.amount) * 100 };
      })
      .sort((a, b) => b.percentageUsed - a.percentageUsed);

    return NextResponse.json({ budgets: budgetStats }, { status: 200 });
  } catch (error) {
    console.error('Budgets GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create or update the budget for a category in a month
export async function POST(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const body = await req.json().catch(() => ({}));

    const amount = parseAmount(body.amount);
    if (amount === null) return NextResponse.json({ error: 'Please enter a budget greater than 0' }, { status: 400 });

    const category = await resolveCategory(userId, body.categoryId);
    if (category.error) return NextResponse.json({ error: category.error }, { status: 400 });

    const { year, month } = targetMonth(body.month);

    const budget = await Budget.findOneAndUpdate(
      { userId, categoryId: category.categoryId, period: 'monthly', month, year },
      { $set: { amount } },
      { new: true, upsert: true }
    ).populate('categoryId', 'name icon color');

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error('Budget POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/budgets?id=<budgetId>
export async function DELETE(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const id = new URL(req.url).searchParams.get('id');
    if (!isObjectId(id)) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });

    const budget = await Budget.findOneAndDelete({ _id: id, userId });
    if (!budget) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });

    return NextResponse.json({ message: 'Budget deleted' }, { status: 200 });
  } catch (error) {
    console.error('Budget DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
