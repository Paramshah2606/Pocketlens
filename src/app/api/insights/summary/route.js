import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Income from '@/models/Income';
import mongoose from 'mongoose';
import { getRangeStart, getRangeEnd, toDateKey } from '@/lib/dateRange';

// Numbers for the dashboard's stat cards. Kept to two queries (one $facet over expenses,
// one income total) so the dashboard needs as few database round trips as possible.
export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || 'month';
    const today = searchParams.get('today');

    const rangeStart = getRangeStart(timeRange, today);
    const rangeEnd = getRangeEnd(timeRange, today);
    const matchQuery = { userId: new mongoose.Types.ObjectId(userId), date: { $gte: rangeStart, $lt: rangeEnd } };

    const [[facets], incomeTotalAgg] = await Promise.all([
      Expense.aggregate([
        { $match: matchQuery },
        {
          $facet: {
            total: [{ $group: { _id: null, total: { $sum: '$amount' } } }],
            topCategory: [
              { $group: { _id: '$categoryId', value: { $sum: '$amount' } } },
              { $sort: { value: -1 } },
              { $limit: 1 },
              { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'catInfo' } },
              { $unwind: '$catInfo' },
            ],
            topSubCategory: [
              { $group: { _id: { cat: '$categoryId', sub: '$subCategoryId' }, value: { $sum: '$amount' } } },
              { $sort: { value: -1 } },
              { $limit: 1 },
              { $lookup: { from: 'categories', localField: '_id.cat', foreignField: '_id', as: 'catInfo' } },
              { $unwind: { path: '$catInfo', preserveNullAndEmptyArrays: true } },
              { $lookup: { from: 'categories', localField: '_id.sub', foreignField: '_id', as: 'subInfo' } },
              { $unwind: { path: '$subInfo', preserveNullAndEmptyArrays: true } },
            ],
          },
        },
      ]),
      Income.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const topCat = facets.topCategory[0];
    const topSub = facets.topSubCategory[0];
    const overallTotalSpent = facets.total[0]?.total || 0;
    const totalIncome = incomeTotalAgg[0]?.total || 0;

    return NextResponse.json({
      overallTotalSpent,
      totalIncome,
      balance: totalIncome - overallTotalSpent,
      topCategory: topCat
        ? { _id: topCat._id, name: topCat.catInfo.name, icon: topCat.catInfo.icon, color: topCat.catInfo.color, value: topCat.value }
        : null,
      topSubCategory: topSub
        ? {
            _id: topSub.subInfo?._id ?? null,
            categoryId: topSub._id.cat ?? null,
            name: topSub.subInfo?.name ?? 'N/A',
            parentCategory: topSub.catInfo?.name ?? 'N/A',
            value: topSub.value,
          }
        : null,
      rangeStart: toDateKey(rangeStart),
      rangeEnd: toDateKey(new Date(rangeEnd.getTime() - 1)),
    }, { status: 200 });
  } catch (error) {
    console.error('Insights GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
