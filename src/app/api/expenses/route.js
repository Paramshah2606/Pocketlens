import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Category from '@/models/Category'; // to populate

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    
    const categoryId = searchParams.get('categoryId');
    const subCategoryId = searchParams.get('subCategoryId');
    const dateType = searchParams.get('dateType') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')) : 1;
    const skip = (page - 1) * limit;

    let query = { userId };

    if (categoryId && categoryId !== 'all') {
      query.categoryId = categoryId;
    }
    if (subCategoryId && subCategoryId !== 'all') {
      query.subCategoryId = subCategoryId;
    }

    // Date filtering
    if (dateType !== 'all') {
      const now = new Date();
      if (dateType === 'today') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
      } else if (dateType === 'thisWeek') {
        const start = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        query.date = { $gte: start };
      } else if (dateType === 'thisMonth') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        query.date = { $gte: start };
      } else if (dateType === 'thisYear') {
        const start = new Date(now.getFullYear(), 0, 1);
        query.date = { $gte: start };
      } else if (dateType === 'single' && startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
      } else if (dateType === 'range' && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
      }
    }

    // Sorting
    let sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    if (sortBy !== 'date') {
        sort.date = -1;
    }

    const total = await Expense.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const expenses = await Expense.find(query)
      .populate('categoryId', 'name icon color subCategories')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return NextResponse.json({ 
      expenses, 
      pagination: {
        total,
        page,
        totalPages,
        limit
      }
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
