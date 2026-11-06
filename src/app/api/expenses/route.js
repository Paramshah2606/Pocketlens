import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import '@/models/Category'; // registers the model used by populate()
import { resolveCategory } from '@/lib/categoryAccess';
import { isObjectId, optionalString, parseAmount, parseDate } from '@/lib/validate';

const SORT_FIELDS = ['date', 'amount', 'createdAt'];
const DAY_MS = 24 * 60 * 60 * 1000;
const CSV_MAX_ROWS = 10000;

// Expense dates are calendar days stored at UTC midnight. "Today" comes from the
// browser (?today=YYYY-MM-DD) so ranges follow the user's own calendar, not the server's.
function dateRange(dateType, todayParam, startParam, endParam) {
  const today = parseDate(todayParam || '') || parseDate(new Date().toISOString().slice(0, 10));
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();

  switch (dateType) {
    case 'today':
      return { $gte: today, $lt: new Date(today.getTime() + DAY_MS) };
    case 'thisWeek': {
      const daysSinceMonday = (today.getUTCDay() + 6) % 7;
      return { $gte: new Date(today.getTime() - daysSinceMonday * DAY_MS) };
    }
    case 'thisMonth':
      return { $gte: new Date(Date.UTC(y, m, 1)) };
    case 'thisYear':
      return { $gte: new Date(Date.UTC(y, 0, 1)) };
    case 'single': {
      const day = parseDate(startParam || '');
      return day ? { $gte: day, $lt: new Date(day.getTime() + DAY_MS) } : null;
    }
    case 'range': {
      const start = parseDate(startParam || '');
      const end = parseDate(endParam || '');
      if (!start || !end) return null;
      const [from, to] = start <= end ? [start, end] : [end, start];
      return { $gte: from, $lt: new Date(to.getTime() + DAY_MS) };
    }
    default:
      return null;
  }
}

function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  // Stop spreadsheet apps from treating text as a formula (CSV injection)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(expenses) {
  const header = ['Date', 'Category', 'Sub-category', 'Description', 'Notes', 'Amount'];
  const rows = expenses.map((e) => [
    new Date(e.date).toISOString().slice(0, 10),
    e.categoryId?.name || 'Uncategorized',
    e.subCategoryId?.name || '',
    e.description || '',
    e.notes || '',
    e.amount,
  ]);
  // BOM so Excel opens UTF-8 (₹, emoji) correctly
  return '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);

    const categoryId = searchParams.get('categoryId');
    const subCategoryId = searchParams.get('subCategoryId');
    const dateType = searchParams.get('dateType') || 'all';
    const sortBy = SORT_FIELDS.includes(searchParams.get('sortBy')) ? searchParams.get('sortBy') : 'date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const format = searchParams.get('format');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit')) || 10, 1), 100);
    const page = Math.max(parseInt(searchParams.get('page')) || 1, 1);

    const query = { userId };
    if (categoryId && categoryId !== 'all') {
      if (!isObjectId(categoryId)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      query.categoryId = categoryId;
    }
    if (subCategoryId && subCategoryId !== 'all') {
      if (!isObjectId(subCategoryId)) return NextResponse.json({ error: 'Invalid sub-category' }, { status: 400 });
      query.subCategoryId = subCategoryId;
    }
    if (dateType !== 'all') {
      const range = dateRange(dateType, searchParams.get('today'), searchParams.get('startDate'), searchParams.get('endDate'));
      if (range) query.date = range;
    }

    const sort = { [sortBy]: sortOrder };
    if (sortBy !== 'date') sort.date = -1;
    sort.createdAt = sort.createdAt ?? -1;

    if (format === 'csv') {
      const expenses = await Expense.find(query)
        .populate('categoryId', 'name')
        .populate('subCategoryId', 'name')
        .sort(sort)
        .limit(CSV_MAX_ROWS)
        .lean();
      return new NextResponse(toCsv(expenses), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pocketlens-expenses-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // aggregate() does not cast types, so build an ObjectId-typed copy of the filter
    const matchQuery = { ...query, userId: new mongoose.Types.ObjectId(userId) };
    if (query.categoryId) matchQuery.categoryId = new mongoose.Types.ObjectId(query.categoryId);
    if (query.subCategoryId) matchQuery.subCategoryId = new mongoose.Types.ObjectId(query.subCategoryId);

    const [total, sumAgg, expenses] = await Promise.all([
      Expense.countDocuments(query),
      Expense.aggregate([{ $match: matchQuery }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Expense.find(query)
        .populate('categoryId', 'name icon color')
        .populate('subCategoryId', 'name icon')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      expenses,
      totalAmount: sumAgg[0]?.sum || 0,
      pagination: { total, page, totalPages: Math.ceil(total / limit), limit }
    }, { status: 200 });
  } catch (error) {
    console.error('Expenses GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const body = await req.json().catch(() => ({}));

    const amount = parseAmount(body.amount);
    if (amount === null) return NextResponse.json({ error: 'Please enter an amount greater than 0' }, { status: 400 });
    const date = parseDate(body.date);
    if (!date) return NextResponse.json({ error: 'Please choose a valid date' }, { status: 400 });
    const description = optionalString(body.description, { max: 200 });
    const notes = optionalString(body.notes, { max: 1000 });
    if (description === null || notes === null) {
      return NextResponse.json({ error: 'Description or notes are too long' }, { status: 400 });
    }

    const category = await resolveCategory(userId, body.categoryId, body.subCategoryId);
    if (category.error) return NextResponse.json({ error: category.error }, { status: 400 });

    const expense = await Expense.create({
      userId,
      categoryId: category.categoryId,
      subCategoryId: category.subCategoryId || undefined,
      amount,
      date,
      description,
      notes,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('categoryId', 'name icon color')
      .populate('subCategoryId', 'name icon')
      .lean();

    return NextResponse.json({ expense: populatedExpense }, { status: 201 });
  } catch (error) {
    console.error('Expense POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
