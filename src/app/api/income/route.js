import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Income from '@/models/Income';
import { INCOME_SOURCE_IDS } from '@/lib/incomeSources';
import { getRangeStart } from '@/lib/dateRange';
import { optionalString, parseAmount, parseDate } from '@/lib/validate';

// GET /api/income?timeRange=week|month|year|all&page=1&limit=20
export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || 'all';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit')) || 20, 1), 100);
    const page = Math.max(parseInt(searchParams.get('page')) || 1, 1);

    const query = { userId };
    if (timeRange !== 'all') query.date = { $gte: getRangeStart(timeRange, searchParams.get('today')) };

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
    const body = await req.json().catch(() => ({}));

    const amount = parseAmount(body.amount);
    if (amount === null) return NextResponse.json({ error: 'Please enter an amount greater than 0' }, { status: 400 });
    const date = parseDate(body.date);
    if (!date) return NextResponse.json({ error: 'Please choose a valid date' }, { status: 400 });
    const source = body.source === undefined ? 'salary' : body.source;
    if (!INCOME_SOURCE_IDS.includes(source)) {
      return NextResponse.json({ error: 'Invalid income source' }, { status: 400 });
    }
    const description = optionalString(body.description, { max: 200 });
    if (description === null) return NextResponse.json({ error: 'Description is too long' }, { status: 400 });

    const income = await Income.create({ userId, amount, source, description, date });

    return NextResponse.json({ income }, { status: 201 });
  } catch (error) {
    console.error('Income POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
