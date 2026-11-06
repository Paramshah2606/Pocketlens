import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import '@/models/Category'; // registers the model used by populate()
import { resolveCategory } from '@/lib/categoryAccess';
import { isObjectId, optionalString, parseAmount, parseDate } from '@/lib/validate';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const $set = {};
    const $unset = {};

    if (body.amount !== undefined) {
      const amount = parseAmount(body.amount);
      if (amount === null) return NextResponse.json({ error: 'Please enter an amount greater than 0' }, { status: 400 });
      $set.amount = amount;
    }
    if (body.date !== undefined) {
      const date = parseDate(body.date);
      if (!date) return NextResponse.json({ error: 'Please choose a valid date' }, { status: 400 });
      $set.date = date;
    }
    for (const [key, max] of [['description', 200], ['notes', 1000]]) {
      if (body[key] !== undefined) {
        const value = optionalString(body[key], { max });
        if (value === null) return NextResponse.json({ error: `${key} is too long` }, { status: 400 });
        $set[key] = value;
      }
    }

    // Category changes: the new category (and sub-category) must belong to this user
    if (body.categoryId !== undefined || body.subCategoryId !== undefined) {
      let categoryId = body.categoryId;
      if (categoryId === undefined) {
        const current = await Expense.findOne({ _id: id, userId }).select('categoryId').lean();
        if (!current) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        categoryId = current.categoryId.toString();
      }
      const category = await resolveCategory(userId, categoryId, body.subCategoryId);
      if (category.error) return NextResponse.json({ error: category.error }, { status: 400 });
      $set.categoryId = category.categoryId;
      if (category.subCategoryId) $set.subCategoryId = category.subCategoryId;
      else $unset.subCategoryId = 1;
    }

    const update = { $set };
    if (Object.keys($unset).length) update.$unset = $unset;

    const expense = await Expense.findOneAndUpdate({ _id: id, userId }, update, { new: true })
      .populate('categoryId', 'name icon color')
      .populate('subCategoryId', 'name icon')
      .lean();

    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    return NextResponse.json({ expense }, { status: 200 });
  } catch (error) {
    console.error('Expense PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    const expense = await Expense.findOneAndDelete({ _id: id, userId });
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    return NextResponse.json({ message: 'Expense deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Expense DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
