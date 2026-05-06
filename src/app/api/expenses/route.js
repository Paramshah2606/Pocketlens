import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Category from '@/models/Category'; // to populate

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 50;

    let query = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    const expenses = await Expense.find(query)
      .populate('categoryId', 'name icon color')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    console.error('Expenses GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const body = await req.json();
    const { categoryId, amount, date, description, notes, subCategoryId } = body;

    if (!categoryId || amount === undefined || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newExpense = await Expense.create({
      userId,
      categoryId,
      subCategoryId,
      amount: Number(amount),
      date: new Date(date),
      description,
      notes
    });

    const populatedExpense = await Expense.findById(newExpense._id).populate('categoryId', 'name icon color');

    return NextResponse.json({ expense: populatedExpense }, { status: 201 });
  } catch (error) {
    console.error('Expense POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
