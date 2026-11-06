import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Income from '@/models/Income';
import { INCOME_SOURCE_IDS } from '@/lib/incomeSources';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Income not found' }, { status: 404 });
    }
    const { amount, source, description, date } = await req.json();

    // Only these fields may change (never userId)
    const updates = {};
    if (amount !== undefined) {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
      }
      updates.amount = value;
    }
    if (source !== undefined) {
      if (!INCOME_SOURCE_IDS.includes(source)) {
        return NextResponse.json({ error: 'Invalid income source' }, { status: 400 });
      }
      updates.source = source;
    }
    if (description !== undefined) updates.description = description;
    if (date !== undefined) updates.date = new Date(date);

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
    if (!mongoose.isValidObjectId(id)) {
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
