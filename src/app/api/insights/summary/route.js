import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Category-wise pie chart data
    const categoryAgg = await Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
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

    // 2. Daily trend graph data
    const dailyAgg = await Expense.aggregate([
      { $match: { userId: userObjectId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 3. Top 5 expenses
    const topExpenses = await Expense.find({ userId, date: { $gte: startOfMonth, $lte: endOfMonth } })
      .populate('categoryId', 'name icon color')
      .sort({ amount: -1 })
      .limit(5);

    return NextResponse.json({ 
      categoryDistribution: categoryAgg,
      dailyTrend: dailyAgg,
      topExpenses
    }, { status: 200 });

  } catch (error) {
    console.error('Insights GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
