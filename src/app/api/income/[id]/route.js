import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Income from '@/models/Income';
import { INCOME_SOURCE_IDS } from '@/lib/incomeSources';
import { isObjectId, optionalString, parseAmount, parseDate } from '@/lib/validate';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    }
    const { amount, source, description, date } = await req.json().catch(() => ({}));

    // Only these fields may change (never userId)
    const updates = {};
    if (amount !== undefined) {
      const value = parseAmount(amount);
      if (value === null) return NextResponse.json({ error: 'Please enter an amount greater than 0' }, { status: 400 });
      updates.amount = value;
    }
    if (source !== undefined) {
      if (!INCOME_SOURCE_IDS.includes(source)) {
        return NextResponse.json({ error: 'Invalid income source' }, { status: 400 });
      }
      updates.source = source;
    }
    if (description !== undefined) {
      const value = optionalString(description, { max: 200 });
      if (value === null) return NextResponse.json({ error: 'Description is too long' }, { status: 400 });
      updates.description = value;
    }
    if (date !== undefined) {
      const value = parseDate(date);
      if (!value) return NextResponse.json({ error: 'Please choose a valid date' }, { status: 400 });
      updates.date = value;
    }

    const income = await Income.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true }).lean();
    if (!income) return NextResponse.json({ error: 'Income not found' }, { status: 404 });

    return NextResponse.json({ income }, { status: 200 });
  } catch (error) {
    console.error('Income PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { id } = await params;
    if (!isObjectId(id)) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    }

    const income = await Income.findOneAndDelete({ _id: id, userId });
    if (!income) return NextResponse.json({ error: 'Income not found' }, { status: 404 });

    return NextResponse.json({ message: 'Income deleted' }, { status: 200 });
  } catch (error) {
    console.error('Income DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
