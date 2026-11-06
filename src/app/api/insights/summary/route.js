import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Income from '@/models/Income';
import '@/models/Category'; // registers the model used by populate()
import mongoose from 'mongoose';
import { getRangeStart } from '@/lib/dateRange';

const SUB_CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
];

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || 'month';
    const categoryId = searchParams.get('categoryId');

    if (categoryId && !mongoose.isValidObjectId(categoryId)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const matchQuery = { userId: userObjectId, date: { $gte: getRangeStart(timeRange, searchParams.get('today')) } };

    // Category-wise distribution, or sub-category drill-down for one category
    const distributionPipeline = categoryId
      ? [
          { $match: { ...matchQuery, categoryId: new mongoose.Types.ObjectId(categoryId) } },
          { $group: { _id: "$subCategoryId", value: { $sum: "$amount" } } },
          { $sort: { value: -1 } },
          { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "subCatInfo" } },
          {
            $project: {
              value: 1,
              name: { $ifNull: [{ $arrayElemAt: ["$subCatInfo.name", 0] }, "Uncategorized"] }
            }
          }
        ]
      : [
          { $match: matchQuery },
          { $group: { _id: "$categoryId", value: { $sum: "$amount" } } },
          { $sort: { value: -1 } },
          { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "categoryInfo" } },
          { $unwind: "$categoryInfo" },
          { $project: { name: "$categoryInfo.name", color: "$categoryInfo.color", value: 1 } }
        ];

    // All queries are independent, so run them in parallel instead of one after another
    const [
      distributionRaw,
      dailyAgg,
      topSubCatAgg,
      overallTotalAgg,
      recentExpenses,
      topCatAgg,
      incomeTotalAgg,
      recentIncome,
    ] = await Promise.all([
      Expense.aggregate(distributionPipeline),

      Expense.aggregate([
        { $match: matchQuery },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, amount: { $sum: "$amount" } } },
        { $sort: { "_id": 1 } }
      ]),

      Expense.aggregate([
        { $match: matchQuery },
        { $group: { _id: { cat: "$categoryId", sub: "$subCategoryId" }, value: { $sum: "$amount" } } },
        { $sort: { value: -1 } },
        { $limit: 1 },
        { $lookup: { from: "categories", localField: "_id.cat", foreignField: "_id", as: "catInfo" } },
        { $unwind: { path: "$catInfo", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "categories", localField: "_id.sub", foreignField: "_id", as: "subInfo" } },
        { $unwind: { path: "$subInfo", preserveNullAndEmptyArrays: true } }
      ]),

      Expense.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),

      Expense.find(matchQuery)
        .populate('categoryId', 'name icon color')
        .populate('subCategoryId', 'name icon')
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .lean(),

      Expense.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$categoryId", value: { $sum: "$amount" } } },
        { $sort: { value: -1 } },
        { $limit: 1 },
        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "catInfo" } },
        { $unwind: "$catInfo" }
      ]),

      Income.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),

      Income.find(matchQuery).sort({ date: -1, createdAt: -1 }).limit(5).lean(),
    ]);

    const distribution = categoryId
      ? distributionRaw.map((item, index) => ({ ...item, color: SUB_CATEGORY_COLORS[index % SUB_CATEGORY_COLORS.length] }))
      : distributionRaw;

    let topSubCategory = null;
    if (topSubCatAgg.length > 0) {
      const top = topSubCatAgg[0];
      topSubCategory = {
        name: top.subInfo?.name ?? "N/A",
        parentCategory: top.catInfo?.name ?? "N/A",
        value: top.value
      };
    }

    const topCategory = topCatAgg.length > 0
      ? { name: topCatAgg[0].catInfo.name, value: topCatAgg[0].value }
      : null;

    const overallTotalSpent = overallTotalAgg[0]?.total || 0;
    const totalIncome = incomeTotalAgg[0]?.total || 0;

    return NextResponse.json({
      distribution,
      dailyTrend: dailyAgg,
      topExpenses: recentExpenses,
      topSubCategory,
      overallTotalSpent,
      topCategory,
      totalIncome,
      balance: totalIncome - overallTotalSpent,
      recentIncome,
    }, { status: 200 });

  } catch (error) {
    console.error('Insights GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
