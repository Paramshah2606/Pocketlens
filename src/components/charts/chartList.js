import { Scale, PieChart, Layers, TrendingUp, BarChart3, Target, CalendarRange } from "lucide-react"

// The charts on /charts/<id>, in the order shown on the dashboard and the chip bar
export const CHARTS = [
  { id: "balance", title: "Income vs Spent", hint: "Where your balance stands", icon: Scale, tint: "bg-emerald-50 text-emerald-600" },
  { id: "category", title: "Categories", hint: "Spending by category", icon: PieChart, tint: "bg-blue-50 text-blue-600" },
  { id: "subcategory", title: "Sub-categories", hint: "Breakdown inside categories", icon: Layers, tint: "bg-purple-50 text-purple-600" },
  { id: "trend", title: "Daily Trend", hint: "Spending day by day", icon: TrendingUp, tint: "bg-sky-50 text-sky-600" },
  { id: "monthly", title: "Monthly", hint: "Last 12 months compared", icon: BarChart3, tint: "bg-indigo-50 text-indigo-600" },
  { id: "budget", title: "Budget vs Actual", hint: "This month's limits", icon: Target, tint: "bg-amber-50 text-amber-600" },
  { id: "weekday", title: "By Weekday", hint: "Which days cost most", icon: CalendarRange, tint: "bg-rose-50 text-rose-600" },
]

export const CHART_IDS = CHARTS.map((c) => c.id)

export const TIME_RANGES = ["week", "month", "year"]

export const rangeLabel = (range) => (range === "week" ? "This week" : range === "year" ? "This year" : "This month")
