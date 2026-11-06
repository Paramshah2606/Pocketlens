import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Income from '@/models/Income';
import '@/models/Category'; // registers the model used by populate()

// Dates are saved from "YYYY-MM-DD" inputs, i.e. at UTC midnight, so all day/month
// boundaries here are computed in UTC to keep each entry on the day it was entered.

// GET /api/calendar?month=YYYY-MM  → per-day totals for that month
// GET /api/calendar?date=YYYY-MM-DD → that day's expenses and income
export async function GET(req) {
  try {
    await dbConnect();
    const userId = new mongoose.Types.ObjectId(req.headers.get('x-user-id'));
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    if (date) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
      if (!m) return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
      const start = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      const end = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + 1));
      const match = { userId, date: { $gte: start, $lt: end } };

      const [expenses, incomes] = await Promise.all([
        Expense.find(match)
          .populate('categoryId', 'name icon color')
          .populate('subCategoryId', 'name icon')
          .sort({ createdAt: -1 })
          .lean(),
        Income.find(match).sort({ createdAt: -1 }).lean(),
      ]);
      return NextResponse.json({ expenses, incomes }, { status: 200 });
    }

    const m = /^(\d{4})-(\d{2})$/.exec(month || '');
    if (!m) return NextResponse.json({ error: 'month must be YYYY-MM' }, { status: 400 });
    const start = new Date(Date.UTC(+m[1], +m[2] - 1, 1));
    const end = new Date(Date.UTC(+m[1], +m[2], 1));
    const match = { userId, date: { $gte: start, $lt: end } };
    const byDay = (field) => [
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, [field]: { $sum: '$amount' }, count: { $sum: 1 } } },
    ];

    const [spentByDay, incomeByDay] = await Promise.all([
      Expense.aggregate(byDay('spent')),
      Income.aggregate(byDay('income')),
    ]);

    // Merge into { 'YYYY-MM-DD': { spent, income, net, count } }
    const days = {};
    for (const d of spentByDay) days[d._id] = { spent: d.spent, income: 0, count: d.count };
    for (const d of incomeByDay) {
      days[d._id] = days[d._id] || { spent: 0, income: 0, count: 0 };
      days[d._id].income = d.income;
      days[d._id].count += d.count;
    }
    let totalSpent = 0;
    let totalIncome = 0;
    for (const day of Object.values(days)) {
      day.net = day.income - day.spent;
      totalSpent += day.spent;
      totalIncome += day.income;
    }

    return NextResponse.json({
      days,
      totals: { spent: totalSpent, income: totalIncome, net: totalIncome - totalSpent },
    }, { status: 200 });
  } catch (error) {
    console.error('Calendar GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
