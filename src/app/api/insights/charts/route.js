import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Income from '@/models/Income';
import { getRangeStart, getRangeEnd, toDateKey } from '@/lib/dateRange';
import { parseDate } from '@/lib/validate';

// Data for one chart on the Charts page: GET ?chart=<id>&timeRange=&today=[&categoryId=]
// Each chart runs only the queries it needs. (The budget chart uses /api/budgets.)

const CHARTS = ['balance', 'category', 'subcategory', 'trend', 'monthly', 'weekday'];
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const monthKey = (date) => date.toISOString().slice(0, 7);

// Every day (or month) key in [start, end), so charts show gaps as zero instead of skipping them
function bucketKeys(start, end, byMonth) {
  const keys = [];
  if (byMonth) {
    for (let d = new Date(start); d < end; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))) {
      keys.push(monthKey(d));
    }
  } else {
    for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) keys.push(toDateKey(new Date(t)));
  }
  return keys;
}

const sumBy = (format) => [
  { $group: { _id: { $dateToString: { format, date: '$date' } }, amount: { $sum: '$amount' } } },
];

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chart = searchParams.get('chart');
    if (!CHARTS.includes(chart)) {
      return NextResponse.json({ error: 'Unknown chart' }, { status: 400 });
    }
    const categoryId = searchParams.get('categoryId');
    if (categoryId && !mongoose.isValidObjectId(categoryId)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId(req.headers.get('x-user-id'));
    const timeRange = ['week', 'month', 'year'].includes(searchParams.get('timeRange')) ? searchParams.get('timeRange') : 'month';
    const today = searchParams.get('today');
    const start = getRangeStart(timeRange, today);
    const end = getRangeEnd(timeRange, today);
    const match = { userId, date: { $gte: start, $lt: end } };
    const range = { rangeStart: toDateKey(start), rangeEnd: toDateKey(new Date(end.getTime() - 1)), timeRange };

    if (chart === 'balance') {
      const byMonth = timeRange === 'year';
      const format = byMonth ? '%Y-%m' : '%Y-%m-%d';
      const [spentAgg, incomeAgg] = await Promise.all([
        Expense.aggregate([{ $match: match }, ...sumBy(format)]),
        Income.aggregate([{ $match: match }, ...sumBy(format)]),
      ]);
      const spent = new Map(spentAgg.map((r) => [r._id, r.amount]));
      const income = new Map(incomeAgg.map((r) => [r._id, r.amount]));
      const series = bucketKeys(start, end, byMonth).map((key) => ({
        key, spent: spent.get(key) || 0, income: income.get(key) || 0,
      }));
      return NextResponse.json({ ...range, byMonth, series });
    }

    if (chart === 'trend') {
      const agg = await Expense.aggregate([{ $match: match }, ...sumBy('%Y-%m-%d')]);
      const amounts = new Map(agg.map((r) => [r._id, r.amount]));
      const series = bucketKeys(start, end, false).map((key) => ({ key, amount: amounts.get(key) || 0 }));
      return NextResponse.json({ ...range, series });
    }

    if (chart === 'category') {
      const items = await Expense.aggregate([
        { $match: match },
        { $group: { _id: '$categoryId', value: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
        { $unwind: '$cat' },
        { $project: { value: 1, count: 1, name: '$cat.name', icon: '$cat.icon', color: '$cat.color' } },
      ]);
      return NextResponse.json({ ...range, items });
    }

    if (chart === 'subcategory') {
      const items = await Expense.aggregate([
        { $match: categoryId ? { ...match, categoryId: new mongoose.Types.ObjectId(categoryId) } : match },
        { $group: { _id: { cat: '$categoryId', sub: '$subCategoryId' }, value: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $lookup: { from: 'categories', localField: '_id.cat', foreignField: '_id', as: 'cat' } },
        { $unwind: '$cat' },
        { $lookup: { from: 'categories', localField: '_id.sub', foreignField: '_id', as: 'sub' } },
        { $unwind: { path: '$sub', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            categoryId: '$_id.cat',
            subCategoryId: { $ifNull: ['$sub._id', null] },
            value: 1,
            count: 1,
            name: { $ifNull: ['$sub.name', 'Other'] },
            icon: { $ifNull: ['$sub.icon', '$cat.icon'] },
            categoryName: '$cat.name',
            // Sub-categories inherit their parent's colour unless they have their own
            color: { $ifNull: ['$sub.color', '$cat.color'] },
            categoryColor: '$cat.color',
          },
        },
      ]);
      return NextResponse.json({ ...range, categoryId: categoryId || null, items });
    }

    if (chart === 'monthly') {
      // Last 12 months up to and including the current one (ignores timeRange)
      const todayDate = parseDate(today || '') || parseDate(new Date().toISOString().slice(0, 10));
      const from = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() - 11, 1));
      const to = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 1, 1));
      const yearMatch = { userId, date: { $gte: from, $lt: to } };
      const [spentAgg, incomeAgg] = await Promise.all([
        Expense.aggregate([{ $match: yearMatch }, ...sumBy('%Y-%m')]),
        Income.aggregate([{ $match: yearMatch }, ...sumBy('%Y-%m')]),
      ]);
      const spent = new Map(spentAgg.map((r) => [r._id, r.amount]));
      const income = new Map(incomeAgg.map((r) => [r._id, r.amount]));
      const series = bucketKeys(from, to, true).map((key) => ({
        key, spent: spent.get(key) || 0, income: income.get(key) || 0,
      }));
      return NextResponse.json({ rangeStart: toDateKey(from), rangeEnd: toDateKey(new Date(to.getTime() - 1)), series });
    }

    // weekday: $dayOfWeek is 1 (Sunday) … 7 (Saturday); reorder to Mon … Sun
    const agg = await Expense.aggregate([
      { $match: match },
      { $group: { _id: { $dayOfWeek: '$date' }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const byDay = new Map(agg.map((r) => [r._id, r]));
    const series = WEEKDAYS.map((day, i) => {
      const row = byDay.get(((i + 1) % 7) + 1);
      return { key: day, amount: row?.amount || 0, count: row?.count || 0 };
    });
    return NextResponse.json({ ...range, series });
  } catch (error) {
    console.error('Charts GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
