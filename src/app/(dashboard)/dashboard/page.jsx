"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { Wallet, TrendingUp, Loader2, ArrowRight, Edit2, Trash2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { useSelector, useDispatch } from "react-redux"
import Link from "next/link"
import { openAddExpenseModal, triggerRefresh } from "@/store/uiSlice"

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  
  const dispatch = useDispatch()
  const refreshTrigger = useSelector((state) => state.ui.refreshTrigger)

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch("/api/insights/summary")
        if (!res.ok) throw new Error("Failed to fetch insights")
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInsights()
  }, [refreshTrigger])

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return
    
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (res.ok) {
        dispatch(triggerRefresh())
      } else {
        alert("Failed to delete expense")
      }
    } catch (error) {
      console.error("Delete error", error)
    }
  }

  const handleEdit = (expense) => {
    dispatch(openAddExpenseModal(expense))
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-red-600 border border-red-100 max-w-4xl mx-auto">
        <p className="font-bold text-lg">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const totalSpent = data?.categoryDistribution?.reduce((acc, curr) => acc + curr.value, 0) || 0

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="text-slate-500 mt-1">Here's a summary of your financial activity this month.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Spent Card */}
        <Card className="rounded-3xl border-slate-100 shadow-sm relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-blue-100">Total Spent</CardTitle>
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Wallet className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold tracking-tight mb-1">{formatCurrency(totalSpent)}</div>
            <p className="text-sm text-blue-100 font-medium">This month</p>
          </CardContent>
        </Card>
        
        {/* Top Category Card */}
        <Card className="rounded-3xl border-slate-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Top Category</CardTitle>
            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {data?.categoryDistribution?.[0]?.name || "N/A"}
            </div>
            <p className="text-sm font-medium text-slate-500">
              {data?.categoryDistribution?.[0]?.value ? formatCurrency(data.categoryDistribution[0].value) : "₹0"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Trend Chart */}
        <Card className="lg:col-span-4 rounded-3xl border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Daily Trend</CardTitle>
            <CardDescription>Your spending pattern throughout the month.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 pb-6">
            <div style={{ width: '100%', height: 300, minWidth: 0 }}>
              <ResponsiveContainer>
                <LineChart data={data?.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="_id" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => value.split("-")[2]}
                    className="text-xs font-medium text-slate-400"
                    dy={10}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₹${value}`}
                    className="text-xs font-medium text-slate-400"
                    dx={-10}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="var(--primary)" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie */}
        <Card className="lg:col-span-3 rounded-3xl border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Categories</CardTitle>
            <CardDescription>Where your money went this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 300, minWidth: 0 }} className="flex items-center justify-center relative">
              {data?.categoryDistribution?.length === 0 ? (
                <p className="text-slate-400 font-medium">No data available</p>
              ) : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data?.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {data?.categoryDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "var(--primary)"} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top 5 Recent Expenses */}
      <Card className="rounded-3xl border-slate-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <CardTitle className="text-xl font-bold">Recent Expenses</CardTitle>
          <Link href="/expenses" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data?.topExpenses?.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-2xl">No expenses this month yet.</p>
            ) : (
              data?.topExpenses?.map(expense => (
                <div key={expense._id} className="flex items-center group">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
                    style={{ backgroundColor: `${expense.categoryId.color}15`, color: expense.categoryId.color }}
                  >
                    <span className="text-xl">{expense.categoryId.icon || "🏷️"}</span>
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-bold text-slate-900">{expense.categoryId.name}</p>
                    <p className="text-xs text-slate-500">{expense.description || "No description"}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <div className="font-bold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </div>
                    <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(expense)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
