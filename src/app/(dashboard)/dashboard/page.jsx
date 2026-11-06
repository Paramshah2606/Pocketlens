"use client"

import { useState } from "react"
import Link from "next/link"
import { useSelector } from "react-redux"
import { Wallet, TrendingUp, Loader2, ChevronDown, ChevronRight, Layers, PiggyBank, Plus, Banknote } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useOpenAdd } from "@/lib/useOpenAdd"
import { localDateKey } from "@/lib/dates"
import { useCachedFetch } from "@/lib/useCachedFetch"
import { CHARTS, rangeLabel } from "@/components/charts/chartList"
import { expensesHref } from "@/components/charts/ChartViews"

// Whole-card link with a visible hover/focus state
const cardLink = "block rounded-3xl outline-none transition-all hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-blue-200"

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("month")
  const [retries, setRetries] = useState(0)
  const refreshTrigger = useSelector((state) => state.ui.refreshTrigger)
  const openAdd = useOpenAdd()

  const query = new URLSearchParams({ timeRange, today: localDateKey() })
  const { data, error, loading } = useCachedFetch(`/api/insights/summary?${query}`, `${refreshTrigger}:${retries}`)

  if (!data && loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data && error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-red-600 border border-red-100 max-w-4xl mx-auto">
        <p className="font-bold text-lg">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => setRetries((n) => n + 1)}>Try Again</Button>
      </div>
    )
  }

  const label = rangeLabel(timeRange)
  const totalSpent = data.overallTotalSpent || 0
  const totalIncome = data.totalIncome || 0
  const balance = totalIncome - totalSpent
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : null
  const { topCategory, topSubCategory } = data
  const range = { rangeStart: data.rangeStart, rangeEnd: data.rangeEnd }
  const balanceHref = `/charts/balance?range=${timeRange}`

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate flex items-center gap-2">
            Overview
            {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-300" aria-label="Refreshing" />}
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm truncate">Financial activity {label.toLowerCase()}.</p>
        </div>
        <div className="relative shrink-0">
          <select
            aria-label="Time range"
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-sm font-semibold rounded-2xl focus:ring-blue-500 focus:border-blue-500 block w-28 sm:w-40 p-2.5 sm:p-3.5 pr-8 sm:pr-10 cursor-pointer transition-all hover:bg-slate-100"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Spent → expenses in this range */}
        <Link href={expensesHref(range)} className={cardLink} aria-label={`Total spent ${label.toLowerCase()}: view expenses`}>
          <Card className="h-full rounded-3xl shadow-sm relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-none hover:shadow-lg hover:shadow-blue-500/20">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-100 uppercase tracking-wider">Total Spent</CardTitle>
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Wallet className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold tracking-tight mb-1">{formatCurrency(totalSpent)}</div>
              <p className="text-sm text-blue-100/80 font-medium flex items-center justify-between">
                {label} <span className="flex items-center gap-0.5 text-xs font-bold text-white/90">View <ChevronRight className="h-3.5 w-3.5" /></span>
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Income → income vs spent chart (the expenses list has no income) */}
        <div className={`${cardLink} relative focus-within:ring-4 focus-within:ring-blue-200`}>
          {/* Full-card link behind the content; the Add income button sits above it */}
          <Link href={balanceHref} className="absolute inset-0 z-[1] rounded-3xl outline-none" aria-label="Income: view income vs spent chart" />
          <Card className="h-full rounded-3xl border-slate-100 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Income</CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-emerald-600 mb-1">{formatCurrency(totalIncome)}</div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <button
                  type="button"
                  onClick={() => openAdd("income")}
                  className="relative z-[2] inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add income
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Balance → income vs spent chart */}
        <Link href={balanceHref} className={`${cardLink} md:col-span-2 lg:col-span-1`} aria-label="Balance: view income vs spent chart">
          <Card className="h-full rounded-3xl border-slate-100 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Balance</CardTitle>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${balance >= 0 ? "bg-blue-50" : "bg-red-50"}`}>
                <PiggyBank className={`h-4 w-4 ${balance >= 0 ? "text-blue-500" : "text-red-500"}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold tracking-tight mb-1 ${balance >= 0 ? "text-slate-900" : "text-red-600"}`}>
                {formatCurrency(balance)}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-500">Income − spent</p>
                {savingsRate !== null && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${savingsRate >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                    {savingsRate >= 0 ? `${savingsRate}% saved` : `${Math.abs(savingsRate)}% over`}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Category → its expenses */}
        <Link
          href={topCategory ? expensesHref({ ...range, categoryId: topCategory._id }) : expensesHref(range)}
          className={cardLink}
          aria-label="Top category: view its expenses"
        >
          <Card className="h-full rounded-3xl border-slate-100 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Top Category</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 mb-1 truncate">
                {topCategory ? `${topCategory.icon || ""} ${topCategory.name}`.trim() : "N/A"}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{formatCurrency(topCategory?.value || 0)}</p>
                {topCategory && totalSpent > 0 && (
                  <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">
                    {Math.round((topCategory.value / totalSpent) * 100)}% of total
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Top Sub-Category → its expenses */}
        <Link
          href={
            topSubCategory?.categoryId
              ? expensesHref({ ...range, categoryId: topSubCategory.categoryId, subCategoryId: topSubCategory._id })
              : expensesHref(range)
          }
          className={cardLink}
          aria-label="Top sub-category: view its expenses"
        >
          <Card className="h-full rounded-3xl border-slate-100 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Top Sub-Category</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                <Layers className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 mb-1 truncate">{topSubCategory?.name || "N/A"}</div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500 truncate">{topSubCategory?.parentCategory || "No Category"}</p>
                <p className="text-xs font-bold text-slate-400">{formatCurrency(topSubCategory?.value || 0)}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts: each opens full size on its own page */}
      <section aria-labelledby="charts-heading" className="space-y-4">
        <div className="flex items-end justify-between px-1">
          <div>
            <h2 id="charts-heading" className="text-xl font-bold text-slate-900">Charts</h2>
            <p className="text-sm text-slate-500">Tap a chart to open it.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {CHARTS.map((c) => {
            const Icon = c.icon
            return (
              <Link
                key={c.id}
                href={`/charts/${c.id}?range=${timeRange}`}
                className="group flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-4 focus-visible:ring-blue-200"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${c.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-1 text-sm font-bold text-slate-900">
                    <span className="truncate">{c.title}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500" />
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 line-clamp-2">{c.hint}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
