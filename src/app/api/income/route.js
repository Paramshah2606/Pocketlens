import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Income from '@/models/Income';
import { INCOME_SOURCE_IDS } from '@/lib/incomeSources';
import { getRangeStart } from '@/lib/dateRange';

// GET /api/income?timeRange=week|month|year|all&page=1&limit=20
export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100);
    const page = Math.max(parseInt(searchParams.get('page')) || 1, 1);

    const query = { userId };
    if (timeRange !== 'all') query.date = { $gte: getRangeStart(timeRange) };

    const [incomes, total] = await Promise.all([
      Income.find(query).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Income.countDocuments(query),
    ]);

    return NextResponse.json({
      incomes,
      pagination: { total, page, totalPages: Math.ceil(total / limit), limit },
    }, { status: 200 });
  } catch (error) {
    console.error('Income GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { amount, source, description, date } = await req.json();

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || !date) {
      return NextResponse.json({ error: 'A positive amount and a date are required' }, { status: 400 });
    }
    if (source && !INCOME_SOURCE_IDS.includes(source)) {
      return NextResponse.json({ error: 'Invalid income source' }, { status: 400 });
    }

    const income = await Income.create({
      userId,
      amount: value,
      source: source || 'salary',
      description,
      date: new Date(date),
    });

    return NextResponse.json({ income }, { status: 201 });
  } catch (error) {
    console.error('Income POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
