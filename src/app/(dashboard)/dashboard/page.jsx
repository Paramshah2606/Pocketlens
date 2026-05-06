"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { Wallet, TrendingUp, Loader2, ArrowRight, Edit2, Trash2, ChevronDown, ArrowLeft, Layers } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useSelector, useDispatch } from "react-redux"
import Link from "next/link"
import { openAddExpenseModal, triggerRefresh } from "@/store/uiSlice"

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [timeRange, setTimeRange] = useState("month")
  const [drillDownCategoryId, setDrillDownCategoryId] = useState(null)
  
  const dispatch = useDispatch()
  const refreshTrigger = useSelector((state) => state.ui.refreshTrigger)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || navigator.maxTouchPoints > 0)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  async function fetchInsights() {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({ timeRange })
      if (drillDownCategoryId) {
        queryParams.append("categoryId", drillDownCategoryId)
      }
      const res = await fetch(`/api/insights/summary?${queryParams.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch insights")
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [refreshTrigger, timeRange, drillDownCategoryId])

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

  const handlePieClick = (entry) => {
    if (!drillDownCategoryId && entry._id) {
      setDrillDownCategoryId(entry._id)
    }
  }

  const getTimeRangeLabel = () => {
    if (timeRange === "week") return "This Week"
    if (timeRange === "year") return "This Year"
    return "This Month"
  }

  if (isLoading && !data) {
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
        <Button variant="outline" className="mt-4" onClick={() => fetchInsights()}>Try Again</Button>
      </div>
    )
  }

  const totalSpent = data?.overallTotalSpent || 0
  const topCategory = data?.topCategory || null

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <g className="chart-label-animate">
        <text 
          x={x} 
          y={y - 6} 
          fill="#334155" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          className="text-[11px] font-bold"
        >
          {name}
        </text>
        <text 
          x={x} 
          y={y + 6} 
          fill="#64748b" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          className="text-[9px] font-medium"
        >
          {`${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="text-slate-500 mt-1">Here's a summary of your financial activity {getTimeRangeLabel().toLowerCase()}.</p>
        </div>
        <div className="relative inline-block group">
          <select 
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl focus:ring-blue-500 focus:border-blue-500 block w-40 p-3.5 pr-10 cursor-pointer transition-all hover:bg-slate-100"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Spent Card */}
        <Card className="rounded-3xl border-slate-100 shadow-sm relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-none">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-blue-100 uppercase tracking-wider">Total Spent</CardTitle>
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Wallet className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold tracking-tight mb-1">{formatCurrency(totalSpent)}</div>
            <p className="text-sm text-blue-100/80 font-medium">{getTimeRangeLabel()}</p>
          </CardContent>
        </Card>
        
        {/* Top Category Card */}
        <Card className="rounded-3xl border-slate-100 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Top Category</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {topCategory?.name || "N/A"}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {topCategory?.value ? formatCurrency(topCategory.value) : "₹0"}
              </p>
              {topCategory && (
                <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">
                  {Math.round((topCategory.value / totalSpent) * 100)}% of total
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Sub-Category Card */}
        <Card className="rounded-3xl border-slate-100 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Top Sub-Category</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Layers className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 mb-1 truncate">
              {data?.topSubCategory?.name || "N/A"}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {data?.topSubCategory?.parentCategory || "No Category"}
              </p>
              <p className="text-xs font-bold text-slate-400">
                {data?.topSubCategory?.value ? formatCurrency(data.topSubCategory.value) : "₹0"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Trend Chart */}
        <Card className="lg:col-span-4 rounded-3xl border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Daily Trend</CardTitle>
            <CardDescription>Your spending pattern {getTimeRangeLabel().toLowerCase()}.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 pb-6">
            <div style={{ width: '100%', height: 300, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.dailyTrend} className="focus:outline-none outline-none">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="_id" 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => value.split("-")[2]}
                    className="text-[10px] font-bold text-slate-400"
                    dy={10}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₹${value}`}
                    className="text-[10px] font-bold text-slate-400"
                    dx={-10}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    dot={{ r: 0 }}
                    activeDot={{ r: 6, fill: "#3b82f6", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Pie */}
        <Card className="lg:col-span-3 rounded-3xl border-slate-100 shadow-sm relative overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">
                {drillDownCategoryId ? "Sub-Categories" : "Categories"}
              </CardTitle>
              <CardDescription>
                {drillDownCategoryId ? "Drill-down view" : "Total spending breakdown"}
              </CardDescription>
            </div>
            {drillDownCategoryId && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                onClick={() => setDrillDownCategoryId(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div style={{ width: '100%', height: 320, minWidth: 0 }} className="flex items-center justify-center relative">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-slate-200" />
              ) : data?.distribution?.length === 0 ? (
                <p className="text-slate-400 font-medium">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart className="focus:outline-none outline-none">
                    <Pie
                      data={data?.distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      onClick={handlePieClick}
                      label={isMobile ? renderCustomLabel : false}
                      labelLine={isMobile ? { stroke: '#cbd5e1', strokeWidth: 1 } : false}
                      className="cursor-pointer outline-none"
                    >
                      {data?.distribution?.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color || "#3b82f6"} 
                          className="hover:opacity-80 transition-opacity outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)} 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Custom Legend */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
              {data?.distribution?.slice(0, 6).map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-2.5 cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => handlePieClick(item)}
                >
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-semibold text-slate-700 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top 5 Recent Expenses */}
      <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-slate-50">
          <div>
            <CardTitle className="text-xl font-bold">Recent Expenses</CardTitle>
            <CardDescription>Showing last 5 expenses {getTimeRangeLabel().toLowerCase()}.</CardDescription>
          </div>
          <Link href="/expenses" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center bg-blue-50 px-4 py-2 rounded-xl transition-colors">
            View all <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {data?.topExpenses?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-slate-400 font-medium">No expenses found for this period.</p>
              </div>
            ) : (
              data?.topExpenses?.map(expense => (
                <div key={expense._id} className="flex items-center group transition-all hover:translate-x-1">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
                    style={{ backgroundColor: `${expense.categoryId.color}15`, color: expense.categoryId.color }}
                  >
                    <span className="text-xl">{expense.categoryId.icon || "🏷️"}</span>
                  </div>
                  <div className="ml-4 space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">{expense.categoryId.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{expense.description || "No description"}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-6">
                    <div className="font-bold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleEdit(expense)}
                        className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(expense._id)}
                        className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
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
