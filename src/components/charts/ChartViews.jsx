"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend,
} from "recharts"
import { ChevronRight } from "lucide-react"

import { formatCurrency } from "@/lib/utils"
import { shade } from "@/lib/colorShades"

// ---------------------------------------------------------------- shared pieces

const INCOME = "#10b981" // emerald-500, the app's income colour
const SPENT = "#3b82f6" // blue-500, the app's spending colour
const GRID = "#eef2f7"
const TICK = { fontSize: 11, fontWeight: 600, fill: "#94a3b8" }
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// ₹1.2k / ₹3.4L style labels for axes, where full amounts would crowd the chart
function compactRupees(value) {
  const abs = Math.abs(value)
  if (abs >= 1e7) return `₹${+(value / 1e7).toFixed(1)}Cr`
  if (abs >= 1e5) return `₹${+(value / 1e5).toFixed(1)}L`
  if (abs >= 1e3) return `₹${+(value / 1e3).toFixed(1)}k`
  return `₹${value}`
}

// "2026-11-05" → "5 Nov"; "2026-11" → "Nov 26"
function dayLabel(key) {
  const [, m, d] = key.split("-")
  return `${+d} ${MONTHS[+m - 1]}`
}
const monthLabel = (key, withYear = false) => {
  const [y, m] = key.split("-")
  return withYear ? `${MONTHS[+m - 1]} ${y.slice(2)}` : MONTHS[+m - 1]
}

// Expenses page, pre-filtered to this range (and category / sub-category)
export function expensesHref({ rangeStart, rangeEnd, categoryId, subCategoryId }) {
  const q = new URLSearchParams({ dateType: "range", startDate: rangeStart, endDate: rangeEnd })
  if (categoryId) q.set("categoryId", categoryId)
  if (categoryId && subCategoryId) q.set("subCategoryId", subCategoryId)
  return `/expenses?${q.toString()}`
}

function ChartTooltip({ active, payload, label, labelFormatter, extra }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl bg-white px-3.5 py-2.5 shadow-xl ring-1 ring-slate-100 text-sm">
      {label !== undefined && (
        <p className="mb-1 text-xs font-semibold text-slate-500">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.payload?.fill || p.color }} />
          <span className="text-slate-600">{p.name}</span>
          <span className="ml-auto pl-3 font-bold text-slate-900">{formatCurrency(p.value)}</span>
        </div>
      ))}
      {extra && <p className="mt-1 text-xs text-slate-400">{extra(payload[0].payload)}</p>}
    </div>
  )
}

function ChartBox({ children, className = "" }) {
  return (
    <div className={`w-full min-w-0 h-[55vh] min-h-[280px] max-h-[480px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  )
}

function Empty({ children = "Nothing recorded for this period yet." }) {
  return (
    <div className="flex h-[40vh] min-h-[220px] items-center justify-center text-center">
      <p className="text-sm font-medium text-slate-400">{children}</p>
    </div>
  )
}

function Stat({ label, value, tone = "text-slate-900", dot }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3 sm:px-4 min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />}
        {label}
      </p>
      <p className={`mt-1 text-lg sm:text-xl font-bold truncate ${tone}`}>{value}</p>
    </div>
  )
}

const legendText = (value) => <span className="text-sm font-semibold text-slate-600">{value}</span>

// ---------------------------------------------------------------- Income vs Spent

export function BalanceChart({ data }) {
  const { totals, cumulative } = useMemo(() => {
    const cumulative = []
    const totals = { income: 0, spent: 0 }
    for (const p of data.series) {
      totals.income += p.income
      totals.spent += p.spent
      cumulative.push({ key: p.key, Income: totals.income, Spent: totals.spent })
    }
    return { totals, cumulative }
  }, [data])

  const balance = totals.income - totals.spent
  const usedPct = totals.income > 0 ? Math.round((totals.spent / totals.income) * 100) : null
  const fmtKey = (k) => (data.byMonth ? monthLabel(k) : dayLabel(k))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Income" value={formatCurrency(totals.income)} tone="text-emerald-600" dot={INCOME} />
        <Stat label="Spent" value={formatCurrency(totals.spent)} dot={SPENT} />
        <Stat label="Balance" value={formatCurrency(balance)} tone={balance >= 0 ? "text-slate-900" : "text-red-600"} />
      </div>

      {usedPct !== null && (
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>Spent {usedPct}% of income</span>
            <span>{balance >= 0 ? `${100 - usedPct}% left` : `${usedPct - 100}% over`}</span>
          </div>
          <div className="h-2.5 rounded-full bg-emerald-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${usedPct > 100 ? "bg-red-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {totals.income === 0 && totals.spent === 0 ? (
        <Empty />
      ) : (
        <div>
          <p className="text-sm font-semibold text-slate-700">Running total</p>
          <p className="text-xs text-slate-400 mb-3">Income received vs money spent so far, {data.byMonth ? "month by month" : "day by day"}.</p>
          <ChartBox>
            <LineChart data={cumulative} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="key" tickFormatter={fmtKey} tick={TICK} tickLine={false} axisLine={false} minTickGap={24} dy={6} />
              <YAxis tickFormatter={compactRupees} tick={TICK} tickLine={false} axisLine={false} width={56} />
              <Tooltip content={<ChartTooltip labelFormatter={fmtKey} />} />
              <Legend verticalAlign="top" align="right" height={32} iconType="circle" iconSize={8} formatter={legendText} />
              <Line type="monotone" dataKey="Income" stroke={INCOME} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
              <Line type="monotone" dataKey="Spent" stroke={SPENT} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
            </LineChart>
          </ChartBox>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- donut + legend list

function Donut({ items, total, onSelect }) {
  return (
    <div className="relative w-full min-w-0 h-[42vh] min-h-[260px] max-h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={items}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={items.length > 1 ? 1.5 : 0}
            stroke="#fff"
            strokeWidth={2}
            onClick={(entry) => onSelect?.(entry.payload ?? entry)}
            className="cursor-pointer outline-none"
            isAnimationActive
          >
            {items.map((item, i) => (
              <Cell key={i} fill={item.fill} className="outline-none" />
            ))}
          </Pie>
          <Tooltip
            content={
              <ChartTooltip extra={(p) => `${Math.round((p.value / total) * 100)}% of spending · ${p.count} ${p.count === 1 ? "entry" : "entries"}`} />
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total</span>
        <span className="text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

function LegendRow({ href, color, icon, name, sub, value, total }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-slate-50 focus-visible:bg-slate-50 outline-none transition-colors">
      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-lg leading-none shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-slate-800">
            {name}
            {sub && <span className="ml-1.5 font-medium text-slate-400">{sub}</span>}
          </span>
          <span className="shrink-0 text-sm font-bold text-slate-900">{formatCurrency(value)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
          <span className="w-9 text-right text-xs font-semibold text-slate-500">{Math.round(pct)}%</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500" />
    </Link>
  )
}

// ---------------------------------------------------------------- Categories

export function CategoryChart({ data }) {
  const router = useRouter()
  const items = data.items.map((c) => ({ ...c, fill: c.color || SPENT }))
  const total = items.reduce((s, c) => s + c.value, 0)
  if (!items.length) return <Empty />

  const hrefFor = (c) => expensesHref({ ...data, categoryId: c._id })
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
      <Donut items={items} total={total} onSelect={(c) => c?._id && router.push(hrefFor(c))} />
      <div className="space-y-0.5">
        {items.map((c) => (
          <LegendRow key={c._id} href={hrefFor(c)} color={c.fill} icon={c.icon} name={c.name} value={c.value} total={total} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Sub-categories

export function SubCategoryChart({ data }) {
  const router = useRouter()
  const [filter, setFilter] = useState(null) // categoryId or null = all

  // Group by category (biggest first); each sub-category gets a shade of its category colour
  const groups = useMemo(() => {
    const map = new Map()
    for (const item of data.items) {
      const key = String(item.categoryId)
      if (!map.has(key)) map.set(key, { categoryId: key, name: item.categoryName, color: item.categoryColor || SPENT, total: 0, items: [] })
      const g = map.get(key)
      g.total += item.value
      g.items.push(item)
    }
    return [...map.values()]
      .sort((a, b) => b.total - a.total)
      .map((g) => ({
        ...g,
        items: g.items.map((item, i) => ({
          ...item,
          // A sub-category with its own colour keeps it; otherwise a shade of the parent's
          fill: item.color && item.color !== item.categoryColor ? item.color : shade(g.color, i, g.items.length),
        })),
      }))
  }, [data])

  if (!groups.length) return <Empty />

  const visible = filter ? groups.filter((g) => g.categoryId === filter) : groups
  const items = visible.flatMap((g) => g.items)
  const total = items.reduce((s, c) => s + c.value, 0)
  const hrefFor = (s) => expensesHref({ ...data, categoryId: s.categoryId, subCategoryId: s.subCategoryId })

  return (
    <div className="space-y-5">
      {groups.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
          {[{ categoryId: null, name: "All categories", color: null }, ...groups].map((g) => {
            const active = filter === g.categoryId
            return (
              <button
                key={g.categoryId ?? "all"}
                onClick={() => setFilter(g.categoryId)}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {g.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />}
                {g.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Donut items={items} total={total} onSelect={(s) => s?.categoryId && router.push(hrefFor(s))} />
        <div className="space-y-4">
          {visible.map((g) => (
            <div key={g.categoryId}>
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                  {g.name}
                </span>
                <span className="text-xs font-bold text-slate-500">{formatCurrency(g.total)}</span>
              </div>
              {g.items.map((s) => (
                <LegendRow
                  key={`${s.categoryId}-${s.subCategoryId}`}
                  href={hrefFor(s)}
                  color={s.fill}
                  icon={s.icon}
                  name={s.name}
                  value={s.value}
                  total={total}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Daily trend

export function TrendChart({ data }) {
  const total = data.series.reduce((s, p) => s + p.amount, 0)
  if (!total) return <Empty />
  const days = data.series.length
  const peak = data.series.reduce((a, b) => (b.amount > a.amount ? b : a))
  const yearView = data.timeRange === "year"
  const fmt = (k) => (yearView ? dayLabel(k) : data.timeRange === "week" ? `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(k).getUTCDay()]} ${+k.slice(8)}` : dayLabel(k))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Total" value={formatCurrency(total)} />
        <Stat label="Daily avg" value={formatCurrency(total / days)} />
        <Stat label="Peak day" value={formatCurrency(peak.amount)} />
      </div>
      <ChartBox>
        <LineChart data={data.series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="key"
            tickFormatter={yearView ? (k) => (k.endsWith("-01") ? monthLabel(k) : "") : fmt}
            interval={yearView ? 0 : "preserveStartEnd"}
            tick={TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={yearView ? 0 : 16}
            dy={6}
          />
          <YAxis tickFormatter={compactRupees} tick={TICK} tickLine={false} axisLine={false} width={56} />
          <Tooltip content={<ChartTooltip labelFormatter={fmt} />} />
          <Line type="monotone" dataKey="amount" name="Spent" stroke={SPENT} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
        </LineChart>
      </ChartBox>
      <p className="text-xs text-slate-400">Highest: {formatCurrency(peak.amount)} on {fmt(peak.key)}.</p>
    </div>
  )
}

// ---------------------------------------------------------------- Monthly

export function MonthlyChart({ data }) {
  const series = data.series.map((p) => ({ ...p, Income: p.income, Spent: p.spent }))
  if (!series.some((p) => p.income || p.spent)) return <Empty>No income or expenses in the last 12 months.</Empty>
  const fmt = (k) => monthLabel(k, true)

  return (
    <div className="space-y-6">
      <ChartBox>
        <BarChart data={series} barGap={2} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="key" tickFormatter={(k) => monthLabel(k)} tick={TICK} tickLine={false} axisLine={false} interval={0} dy={6} />
          <YAxis tickFormatter={compactRupees} tick={TICK} tickLine={false} axisLine={false} width={56} />
          <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip labelFormatter={fmt} extra={(p) => `Saved ${formatCurrency(p.income - p.spent)}`} />} />
          <Legend verticalAlign="top" align="right" height={32} iconType="circle" iconSize={8} formatter={legendText} />
          <Bar dataKey="Income" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Spent" fill={SPENT} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ChartBox>

      {/* Table view of the same numbers, newest first */}
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Month</th>
              <th className="px-3 py-2 text-right font-semibold">Income</th>
              <th className="px-3 py-2 text-right font-semibold">Spent</th>
              <th className="px-3 py-2 text-right font-semibold">Saved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[...series].reverse().map((p) => {
              const saved = p.income - p.spent
              return (
                <tr key={p.key}>
                  <td className="px-3 py-2 font-semibold text-slate-700">{fmt(p.key)}</td>
                  <td className="px-3 py-2 text-right text-emerald-600">{formatCurrency(p.income)}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{formatCurrency(p.spent)}</td>
                  <td className={`px-3 py-2 text-right font-bold ${saved < 0 ? "text-red-600" : "text-slate-900"}`}>{formatCurrency(saved)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Budget vs actual

export function BudgetChart({ data }) {
  const budgets = data.budgets || []
  if (!budgets.length) {
    return (
      <Empty>
        No budgets set for this month.{" "}
        <Link href="/budgets" className="font-semibold text-blue-600 hover:underline">Set a budget</Link>
      </Empty>
    )
  }
  const limit = budgets.reduce((s, b) => s + b.amount, 0)
  const spent = budgets.reduce((s, b) => s + b.spent, 0)
  const over = budgets.filter((b) => b.spent > b.amount).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Budgeted" value={formatCurrency(limit)} />
        <Stat label="Spent" value={formatCurrency(spent)} tone={spent > limit ? "text-red-600" : "text-slate-900"} />
        <Stat label="Over limit" value={`${over} of ${budgets.length}`} tone={over ? "text-red-600" : "text-slate-900"} />
      </div>
      <div className="space-y-4">
        {budgets.map((b) => {
          const pct = b.amount > 0 ? (b.spent / b.amount) * 100 : 0
          const isOver = b.spent > b.amount
          const color = b.categoryId?.color || SPENT
          return (
            <div key={b._id}>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-2 min-w-0 text-sm font-semibold text-slate-800">
                  <span className="text-lg leading-none">{b.categoryId?.icon}</span>
                  <span className="truncate">{b.categoryId?.name}</span>
                </span>
                <span className="shrink-0 text-sm">
                  <span className={`font-bold ${isOver ? "text-red-600" : "text-slate-900"}`}>{formatCurrency(b.spent)}</span>
                  <span className="text-slate-400"> / {formatCurrency(b.amount)}</span>
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isOver ? "#ef4444" : color }}
                />
              </div>
              <p className={`mt-1 text-xs font-semibold ${isOver ? "text-red-600" : "text-slate-500"}`}>
                {isOver ? `⚠ Over by ${formatCurrency(b.spent - b.amount)}` : `${Math.round(pct)}% used · ${formatCurrency(b.amount - b.spent)} left`}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- By weekday

export function WeekdayChart({ data }) {
  const total = data.series.reduce((s, p) => s + p.amount, 0)
  if (!total) return <Empty />
  const max = Math.max(...data.series.map((p) => p.amount))
  const top = data.series.find((p) => p.amount === max)

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        You spend the most on <span className="font-bold text-slate-900">{top.key}</span>
        {" "}({formatCurrency(top.amount)}, {Math.round((top.amount / total) * 100)}% of the total).
      </p>
      <ChartBox>
        <BarChart data={data.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="key" tick={TICK} tickLine={false} axisLine={false} dy={6} />
          <YAxis tickFormatter={compactRupees} tick={TICK} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            content={<ChartTooltip extra={(p) => `${p.count} ${p.count === 1 ? "entry" : "entries"}`} />}
          />
          <Bar dataKey="amount" name="Spent" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.series.map((p) => (
              <Cell key={p.key} fill={p.amount === max ? SPENT : "#bfdbfe"} />
            ))}
          </Bar>
        </BarChart>
      </ChartBox>
    </div>
  )
}
