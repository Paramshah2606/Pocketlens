"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useSyncExternalStore } from "react"
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend,
} from "recharts"
import { ChevronRight } from "lucide-react"

import { formatCurrency } from "@/lib/utils"
import { shade } from "@/lib/colorShades"

// ---------------------------------------------------------------- shared pieces

// Tooltips only where there's a real hover (mouse / trackpad). On touch screens a tap would
// leave a tooltip stuck over the chart, so phones get the numbers from the lists instead.
const HOVER_QUERY = "(hover: hover) and (pointer: fine)"
function subscribeHover(onChange) {
  const mq = window.matchMedia(HOVER_QUERY)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}
function useCanHover() {
  return useSyncExternalStore(subscribeHover, () => window.matchMedia(HOVER_QUERY).matches, () => false)
}

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

// Shown instead of an empty chart: the same chart with made-up numbers, clearly marked as
// a sample (banner + watermark) and not interactive, so people see what they'll get.
function SamplePreview({ hint, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3">
        <span className="mt-0.5 shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Sample</span>
        <p className="text-sm text-amber-900">
          <span className="font-bold">This is a dummy chart, not your data.</span> {hint}
        </p>
      </div>
      <div inert className="relative select-none opacity-60 saturate-[.8]" aria-hidden="true">
        <div className="pointer-events-none absolute inset-x-0 top-[28%] z-10 flex justify-center">
          <span className="-rotate-12 rounded-2xl border-[3px] border-amber-400/80 bg-white/60 px-5 py-1.5 text-2xl sm:text-3xl font-black uppercase tracking-[0.3em] text-amber-500">
            Sample
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

const SAMPLE_CATEGORIES = [
  { _id: "s1", name: "Rent", icon: "🏠", color: "#3b82f6", value: 15000, count: 1 },
  { _id: "s2", name: "Food", icon: "🍔", color: "#f97316", value: 8200, count: 23 },
  { _id: "s3", name: "Travel", icon: "🚕", color: "#10b981", value: 4300, count: 11 },
  { _id: "s4", name: "Shopping", icon: "🛍️", color: "#ec4899", value: 3600, count: 4 },
  { _id: "s5", name: "Bills", icon: "💡", color: "#8b5cf6", value: 2400, count: 3 },
]
const SAMPLE_SUBS = [
  ["s1", "Rent", "#3b82f6", [["House rent", "🏠", 15000]]],
  ["s2", "Food", "#f97316", [["Groceries", "🛒", 3900], ["Dining out", "🍽️", 2800], ["Snacks", "🍿", 1500]]],
  ["s3", "Travel", "#10b981", [["Cab", "🚕", 2600], ["Fuel", "⛽", 1700]]],
  ["s4", "Shopping", "#ec4899", [["Clothes", "👕", 2400], ["Gadgets", "🎧", 1200]]],
]
// A gentle made-up wave so sample lines and bars look like real spending
const wave = (i) => Math.round(600 + 450 * Math.abs(Math.sin(i * 1.7)) + (i % 7 === 5 ? 900 : 0))

const sampleData = {
  balance: (data) => ({ ...data, series: [{ key: "sample", income: 50000, spent: 33500 }] }),
  category: (data) => ({ ...data, items: SAMPLE_CATEGORIES }),
  subcategory: (data) => ({
    ...data,
    items: SAMPLE_SUBS.flatMap(([categoryId, categoryName, categoryColor, subs]) =>
      subs.map(([name, icon, value], i) => ({
        categoryId, categoryName, categoryColor, color: categoryColor, subCategoryId: `${categoryId}-${i}`, name, icon, value, count: 3,
      }))
    ),
  }),
  trend: (data) => ({ ...data, series: data.series.map((p, i) => ({ ...p, amount: wave(i) })) }),
  monthly: (data) => ({
    ...data,
    series: data.series.map((p, i) => ({ ...p, income: 50000 + (i % 4 === 3 ? 6000 : 0), spent: 30000 + ((i * 7919) % 15000) })),
  }),
  budget: () => ({
    budgets: [
      { _id: "b1", amount: 10000, spent: 8200, categoryId: { name: "Food", icon: "🍔", color: "#f97316" } },
      { _id: "b2", amount: 5000, spent: 5900, categoryId: { name: "Shopping", icon: "🛍️", color: "#ec4899" } },
      { _id: "b3", amount: 6000, spent: 2700, categoryId: { name: "Travel", icon: "🚕", color: "#10b981" } },
    ],
  }),
  weekday: (data) => ({ ...data, series: data.series.map((p, i) => ({ ...p, amount: [1800, 1500, 2100, 1700, 2600, 4200, 3500][i], count: 4 })) }),
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

export function BalanceChart({ data, sample = false }) {
  const totals = data.series.reduce((t, p) => ({ income: t.income + p.income, spent: t.spent + p.spent }), { income: 0, spent: 0 })

  if (!sample && totals.income === 0 && totals.spent === 0) {
    return (
      <SamplePreview hint="Add your salary or other income and your expenses to see how much of it you have spent and how much is left.">
        <BalanceChart data={sampleData.balance(data)} sample />
      </SamplePreview>
    )
  }

  const balance = totals.income - totals.spent
  const over = balance < 0
  const usedPct = totals.income > 0 ? Math.round((totals.spent / totals.income) * 100) : null

  // The full circle is your income: spent + what's left. When spending passes income, the
  // circle becomes everything spent: the part income covered + the overspend in red.
  const slices = !over
    ? [
        { name: "Spent", value: totals.spent, fill: SPENT },
        { name: "Left", value: balance, fill: INCOME },
      ]
    : [
        { name: "Covered by income", value: totals.income, fill: SPENT },
        { name: "Over income", value: -balance, fill: "#ef4444" },
      ]
  const items = slices.filter((x) => x.value > 0)
  const whole = items.reduce((t, x) => t + x.value, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Income" value={formatCurrency(totals.income)} tone="text-emerald-600" dot={INCOME} />
        <Stat label="Spent" value={formatCurrency(totals.spent)} dot={SPENT} />
        <Stat label={over ? "Over" : "Left"} value={formatCurrency(Math.abs(balance))} tone={over ? "text-red-600" : "text-slate-900"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <Donut
          items={items}
          total={whole}
          labels
          center={
            <>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{over ? "Over by" : "Left"}</span>
              <span className={`text-lg sm:text-2xl font-bold ${over ? "text-red-600" : "text-slate-900"}`}>{formatCurrency(Math.abs(balance))}</span>
            </>
          }
          tooltipExtra={(p) => totals.income > 0 ? `${Math.round((p.value / totals.income) * 100)}% of income` : "No income recorded"}
        />
        <div className="space-y-4">
          {usedPct !== null ? (
            <p className="text-sm text-slate-600">
              You have spent <span className="font-bold text-slate-900">{usedPct}%</span> of your income
              {over ? (
                <> — <span className="font-bold text-red-600">{formatCurrency(-balance)} more</span> than you earned.</>
              ) : (
                <> and saved <span className="font-bold text-emerald-600">{100 - usedPct}%</span>.</>
              )}
            </p>
          ) : (
            <p className="text-sm text-slate-600">No income recorded for this period, so everything spent is shown as over income.</p>
          )}
          <div className="space-y-2">
            {items.map((x) => (
              <div key={x.name} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: x.fill }} />
                <span className="flex-1 text-sm font-semibold text-slate-700">{x.name}</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(x.value)}</span>
                <span className="w-10 text-right text-xs font-semibold text-slate-500">{Math.round((x.value / whole) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- donut + legend list

const MIN_LABEL_SHARE = 0.04 // smaller slices skip the outside label (still in the list below)
const shortName = (name) => (name.length > 12 ? `${name.slice(0, 11)}…` : name)

// Name + % outside the slice, joined to it by a short line in the slice's colour
function sliceLabel(total) {
  return function SliceLabel({ x, y, textAnchor, value, name, payload }) {
    if (!total || value / total < MIN_LABEL_SHARE) return null
    return (
      <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" className="pointer-events-none">
        <tspan x={x} dy="-0.45em" fontSize={11} fontWeight={700} fill="#334155">{shortName(name ?? payload?.name ?? "")}</tspan>
        <tspan x={x} dy="1.25em" fontSize={10} fontWeight={600} fill="#94a3b8">{Math.round((value / total) * 100)}%</tspan>
      </text>
    )
  }
}
function sliceLine(total) {
  return function SliceLine({ points, value, stroke, payload }) {
    if (!total || value / total < MIN_LABEL_SHARE || !points?.length) return null
    const [a, b] = points
    return <path d={`M${a.x},${a.y}L${b.x},${b.y}`} stroke={payload?.fill || stroke} strokeWidth={1.5} fill="none" />
  }
}

function Donut({ items, total, onSelect, labels = false, center, tooltipExtra }) {
  const canHover = useCanHover()
  return (
    <div className={`relative w-full min-w-0 ${labels ? "h-[300px] sm:h-[360px]" : "h-[42vh] min-h-[260px] max-h-[380px]"}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={labels ? { top: 16, right: 8, bottom: 16, left: 8 } : undefined}>
          <Pie
            data={items}
            dataKey="value"
            nameKey="name"
            innerRadius={labels ? "44%" : "58%"}
            outerRadius={labels ? "66%" : "88%"}
            paddingAngle={items.length > 1 ? 1.5 : 0}
            stroke="#fff"
            strokeWidth={2}
            label={labels ? sliceLabel(total) : false}
            labelLine={labels ? sliceLine(total) : false}
            onClick={(entry) => onSelect?.(entry.payload ?? entry)}
            className={`${onSelect ? "cursor-pointer" : ""} outline-none`}
            // Recharts only draws pie labels after its entry animation reports finishing,
            // which doesn't always happen; labelled pies skip the animation so labels always show
            isAnimationActive={!labels}
          >
            {items.map((item, i) => (
              <Cell key={i} fill={item.fill} className="outline-none" />
            ))}
          </Pie>
          {canHover && (
            <Tooltip
              content={
                <ChartTooltip
                  extra={tooltipExtra || ((p) => `${Math.round((p.value / total) * 100)}% of spending · ${p.count} ${p.count === 1 ? "entry" : "entries"}`)}
                />
              }
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {center || (
          <>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total</span>
            <span className={`${labels ? "text-base sm:text-xl" : "text-xl sm:text-2xl"} font-bold text-slate-900`}>{formatCurrency(total)}</span>
          </>
        )}
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

export function CategoryChart({ data, sample = false }) {
  const router = useRouter()
  const items = data.items.map((c) => ({ ...c, fill: c.color || SPENT }))
  const total = items.reduce((s, c) => s + c.value, 0)
  if (!items.length && !sample) {
    return (
      <SamplePreview hint="Add expenses to see how your spending splits across your categories, in the colours you picked for them.">
        <CategoryChart data={sampleData.category(data)} sample />
      </SamplePreview>
    )
  }

  const hrefFor = (c) => expensesHref({ ...data, categoryId: c._id })
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
      <Donut items={items} total={total} labels onSelect={(c) => c?._id && router.push(hrefFor(c))} />
      <div className="space-y-0.5">
        {items.map((c) => (
          <LegendRow key={c._id} href={hrefFor(c)} color={c.fill} icon={c.icon} name={c.name} value={c.value} total={total} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Sub-categories

export function SubCategoryChart({ data, sample = false }) {
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

  if (!groups.length && !sample) {
    return (
      <SamplePreview hint="Add expenses with sub-categories to see the breakdown inside each category, shaded in its colour.">
        <SubCategoryChart data={sampleData.subcategory(data)} sample />
      </SamplePreview>
    )
  }

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
        <Donut items={items} total={total} labels onSelect={(s) => s?.categoryId && router.push(hrefFor(s))} />
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

export function TrendChart({ data, sample = false }) {
  const canHover = useCanHover()
  const total = data.series.reduce((s, p) => s + p.amount, 0)
  if (!total && !sample) {
    return (
      <SamplePreview hint="Add expenses to see your spending day by day, your daily average and your biggest day.">
        <TrendChart data={sampleData.trend(data)} sample />
      </SamplePreview>
    )
  }
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
          {canHover && <Tooltip content={<ChartTooltip labelFormatter={fmt} />} />}
          <Line type="monotone" dataKey="amount" name="Spent" stroke={SPENT} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
        </LineChart>
      </ChartBox>
      <p className="text-xs text-slate-400">Highest: {formatCurrency(peak.amount)} on {fmt(peak.key)}.</p>
    </div>
  )
}

// ---------------------------------------------------------------- Monthly

export function MonthlyChart({ data, sample = false }) {
  const canHover = useCanHover()
  const series = data.series.map((p) => ({ ...p, Income: p.income, Spent: p.spent }))
  if (!sample && !series.some((p) => p.income || p.spent)) {
    return (
      <SamplePreview hint="Add income and expenses to compare the last 12 months and see what you saved each month.">
        <MonthlyChart data={sampleData.monthly(data)} sample />
      </SamplePreview>
    )
  }
  const fmt = (k) => monthLabel(k, true)

  return (
    <div className="space-y-6">
      <ChartBox>
        <BarChart data={series} barGap={2} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="key" tickFormatter={(k) => monthLabel(k)} tick={TICK} tickLine={false} axisLine={false} interval={0} dy={6} />
          <YAxis tickFormatter={compactRupees} tick={TICK} tickLine={false} axisLine={false} width={56} />
          {canHover && (
            <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip labelFormatter={fmt} extra={(p) => `Saved ${formatCurrency(p.income - p.spent)}`} />} />
          )}
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

export function BudgetChart({ data, sample = false }) {
  const budgets = data.budgets || []
  if (!budgets.length && !sample) {
    return (
      <div className="space-y-4">
        <SamplePreview hint="Set a monthly budget for your categories to track spending against each limit here.">
          <BudgetChart data={sampleData.budget()} sample />
        </SamplePreview>
        <div className="flex justify-center">
          <Link href="/budgets" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700">
            Set a budget
          </Link>
        </div>
      </div>
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

export function WeekdayChart({ data, sample = false }) {
  const canHover = useCanHover()
  const total = data.series.reduce((s, p) => s + p.amount, 0)
  if (!total && !sample) {
    return (
      <SamplePreview hint="Add expenses to see which days of the week you spend the most on.">
        <WeekdayChart data={sampleData.weekday(data)} sample />
      </SamplePreview>
    )
  }
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
          {canHover && (
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              content={<ChartTooltip extra={(p) => `${p.count} ${p.count === 1 ? "entry" : "entries"}`} />}
            />
          )}
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
