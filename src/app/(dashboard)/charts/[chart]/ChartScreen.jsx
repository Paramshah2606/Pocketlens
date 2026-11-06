"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CHARTS, TIME_RANGES, rangeLabel } from "@/components/charts/chartList"
import {
  BalanceChart, CategoryChart, SubCategoryChart, TrendChart, MonthlyChart, BudgetChart, WeekdayChart,
} from "@/components/charts/ChartViews"
import { useCachedFetch } from "@/lib/useCachedFetch"
import { localDateKey, localMonthKey } from "@/lib/dates"

const VIEWS = {
  balance: BalanceChart,
  category: CategoryChart,
  subcategory: SubCategoryChart,
  trend: TrendChart,
  monthly: MonthlyChart,
  budget: BudgetChart,
  weekday: WeekdayChart,
}

// Charts that cover a fixed period rather than the week/month/year selector
const FIXED_PERIOD = { monthly: "Last 12 months", budget: "This month" }

function dataUrl(chart, range) {
  if (chart === "budget") return `/api/budgets?month=${localMonthKey()}`
  const q = new URLSearchParams({ chart, timeRange: range, today: localDateKey() })
  return `/api/insights/charts?${q.toString()}`
}

export default function ChartScreen({ chart }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlRange = searchParams.get("range")
  const range = TIME_RANGES.includes(urlRange) ? urlRange : "month"
  const refreshTrigger = useSelector((state) => state.ui.refreshTrigger)
  const def = CHARTS.find((c) => c.id === chart)
  const View = VIEWS[chart]
  const fixed = FIXED_PERIOD[chart]

  const [retries, setRetries] = useState(0)
  const { data, error, loading } = useCachedFetch(dataUrl(chart, range), `${refreshTrigger}:${retries}`)

  // Keep the active chip in view on narrow screens
  const activeChip = useRef(null)
  useEffect(() => {
    activeChip.current?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [chart])

  const changeRange = (value) => {
    router.replace(`/charts/${chart}?range=${value}`, { scroll: false })
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">{def.title}</h1>
            <p className="text-slate-500 mt-0.5 text-xs sm:text-sm truncate">
              {def.hint} · {(fixed || rangeLabel(range)).toLowerCase()}
            </p>
          </div>
        </div>
        {!fixed && (
          <div className="relative shrink-0">
            <select
              aria-label="Time range"
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-sm font-semibold rounded-2xl focus:ring-blue-500 focus:border-blue-500 block w-28 sm:w-36 p-2.5 sm:p-3 pr-8 sm:pr-10 cursor-pointer hover:bg-slate-100"
              value={range}
              onChange={(e) => changeRange(e.target.value)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Switch between charts */}
      <nav aria-label="Charts" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
        {CHARTS.map((c) => {
          const active = c.id === chart
          const Icon = c.icon
          return (
            <Link
              key={c.id}
              ref={active ? activeChip : undefined}
              href={`/charts/${c.id}?range=${range}`}
              replace
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                active ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {c.title}
            </Link>
          )
        })}
      </nav>

      {/* Chart */}
      <div className="relative bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100">
        {loading && data && (
          <Loader2 className="absolute right-4 top-4 h-4 w-4 animate-spin text-slate-300" aria-label="Refreshing" />
        )}
        {data ? (
          <View data={data} />
        ) : error ? (
          <div className="flex h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <Button variant="outline" onClick={() => setRetries((n) => n + 1)}>Try again</Button>
          </div>
        ) : (
          <div className="flex h-[40vh] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  )
}
