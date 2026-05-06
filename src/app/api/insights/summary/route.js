import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Category from '@/models/Category';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || 'month';
    const categoryId = searchParams.get('categoryId');

    const now = new Date();
    let startDate;
    if (timeRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const matchQuery = { userId: userObjectId, date: { $gte: startDate } };

    // 1. Category-wise distribution (or Sub-category drill-down)
    let distribution;
    if (categoryId) {
      const catObjId = new mongoose.Types.ObjectId(categoryId);
      distribution = await Expense.aggregate([
        { $match: { ...matchQuery, categoryId: catObjId } },
        { $group: { _id: "$subCategoryId", value: { $sum: "$amount" } } },
        { $sort: { value: -1 } },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "subCatInfo"
          }
        },
        {
          $project: {
            value: 1,
            name: { $ifNull: [{ $arrayElemAt: ["$subCatInfo.name", 0] }, "Uncategorized"] }
          }
        }
      ]);
    } else {
      distribution = await Expense.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$categoryId", value: { $sum: "$amount" } } },
        { $sort: { value: -1 } },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryInfo"
          }
        },
        { $unwind: "$categoryInfo" },
        {
          $project: {
            name: "$categoryInfo.name",
            color: "$categoryInfo.color",
            value: 1
          }
        }
      ]);
    }

    // 2. Daily trend graph data
    const dailyAgg = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 3. Top Sub-category overall
    const topSubCatAgg = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: { cat: "$categoryId", sub: "$subCategoryId" }, value: { $sum: "$amount" } } },
      { $sort: { value: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "categories",
          localField: "_id.cat",
          foreignField: "_id",
          as: "catInfo"
        }
      },
      { $unwind: { path: "$catInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "_id.sub",
          foreignField: "_id",
          as: "subInfo"
        }
      },
      { $unwind: { path: "$subInfo", preserveNullAndEmptyArrays: true } }
    ]);

    let topSubCategory = null;
    if (topSubCatAgg.length > 0) {
      const top = topSubCatAgg[0];
      topSubCategory = {
        name: top.subInfo?.name ?? "N/A",
        parentCategory: top.catInfo?.name ?? "N/A",
        value: top.value
      };
    }

    // 4. Overall total spent (for stats cards)
    const overallTotalAgg = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const overallTotalSpent = overallTotalAgg.length > 0 ? overallTotalAgg[0].total : 0;

    // 5. Recent expenses
    const recentExpenses = await Expense.find(matchQuery)
      .populate('categoryId', 'name icon color')
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    // 6. Top Category (overall)
    const topCatAgg = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$categoryId", value: { $sum: "$amount" } } },
      { $sort: { value: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "catInfo"
        }
      },
      { $unwind: "$catInfo" }
    ]);
    const topCategory = topCatAgg.length > 0 ? {
      name: topCatAgg[0].catInfo.name,
      value: topCatAgg[0].value
    } : null;

    // Color generation for sub-categories
    if (categoryId && distribution) {
      const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
        '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
      ];
      distribution = distribution.map((item, index) => ({
        ...item,
        color: colors[index % colors.length]
      }));
    }

    return NextResponse.json({ 
      distribution,
      dailyTrend: dailyAgg,
      topExpenses: recentExpenses,
      topSubCategory,
      overallTotalSpent,
      topCategory
    }, { status: 200 });

  } catch (error) {
    console.error('Insights GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
