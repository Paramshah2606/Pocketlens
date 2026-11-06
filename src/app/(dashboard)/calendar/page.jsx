"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { getIncomeSource } from "@/lib/incomeSources"
import { openAddExpenseModal, openAddIncomeModal } from "@/store/uiSlice"
import { useOpenAdd } from "@/lib/useOpenAdd"
import { useDeleteEntry } from "@/components/DeleteEntryDialog"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const compactFormatter = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 })

const pad = (n) => String(n).padStart(2, "0")
const dayKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}` // m is 0-based
const monthKey = (y, m) => `${y}-${pad(m + 1)}`

// "+₹1.2K" / "−₹45K" for the small calendar cells
function compact(amount, withSign = true) {
  const sign = !withSign || amount === 0 ? "" : amount > 0 ? "+" : "−"
  return `${sign}₹${compactFormatter.format(Math.abs(amount))}`
}

// Green for a positive day, red for a negative one; stronger colour for bigger amounts.
// Green and red days are scaled separately (a salary day shouldn't wash out every
// spending day), and the square root keeps small days visible.
function cellTint(net, scale) {
  if (!net) return undefined
  const max = net > 0 ? scale.maxGain : scale.maxLoss
  const strength = 0.12 + 0.43 * Math.sqrt(Math.min(Math.abs(net) / (max || 1), 1))
  return net > 0 ? `rgba(34, 197, 94, ${strength})` : `rgba(239, 68, 68, ${strength})`
}

function signedCurrency(amount) {
  if (amount > 0) return `+${formatCurrency(amount)}`
  if (amount < 0) return `−${formatCurrency(Math.abs(amount))}`
  return formatCurrency(0)
}

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load")
  return res.json()
}

export default function CalendarPage() {
  const dispatch = useDispatch()
  const refreshTrigger = useSelector((state) => state.ui.refreshTrigger)
  const { requestDelete, deleteDialog } = useDeleteEntry()
  const openAdd = useOpenAdd()

  const today = useMemo(() => new Date(), [])
  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate())

  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selected, setSelected] = useState(todayKey)
  const [monthData, setMonthData] = useState(null)
  const [monthError, setMonthError] = useState("")
  const [dayData, setDayData] = useState(null)
  const [dayLoadedFor, setDayLoadedFor] = useState(null)

  const detailRef = useRef(null)
  const touchStartX = useRef(null)

  const currentMonthKey = monthKey(view.year, view.month)
  const monthLoading = monthData?.key !== currentMonthKey

  // Month totals per day
  useEffect(() => {
    let active = true
    getJson(`/api/calendar?month=${currentMonthKey}`)
      .then((data) => {
        if (!active) return
        setMonthData({ key: currentMonthKey, ...data })
        setMonthError("")
      })
      .catch(() => active && setMonthError("Couldn't load this month. Please try again."))
    return () => {
      active = false
    }
  }, [currentMonthKey, refreshTrigger])

  // Entries for the selected day
  useEffect(() => {
    if (!selected) return
    let active = true
    getJson(`/api/calendar?date=${selected}`)
      .then((data) => {
        if (!active) return
        setDayData(data)
        setDayLoadedFor(`${selected}#${refreshTrigger}`)
      })
      .catch(() => {
        if (!active) return
        setDayData({ expenses: [], incomes: [], error: true })
        setDayLoadedFor(`${selected}#${refreshTrigger}`)
      })
    return () => {
      active = false
    }
  }, [selected, refreshTrigger])

  const dayLoading = selected && dayLoadedFor !== `${selected}#${refreshTrigger}`

  const changeMonth = (delta) => {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
    // Keep "today" selected when coming back to the current month
    const isCurrent = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
    setSelected(isCurrent ? todayKey : null)
  }

  const goToToday = () => {
    setView({ year: today.getFullYear(), month: today.getMonth() })
    setSelected(todayKey)
  }

  const selectDay = (key) => {
    setSelected(key)
    // Below the xl breakpoint the details sit under the calendar, so bring them into view
    if (window.innerWidth < 1280) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
    }
  }

  // Calendar grid: leading blanks so the 1st lands on the right weekday (Monday first)
  const firstWeekday = (new Date(view.year, view.month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const days = (!monthLoading && monthData?.days) || {}
  const totals = (!monthLoading && monthData?.totals) || { spent: 0, income: 0, net: 0 }
  const nets = Object.values(days).map((d) => d.net)
  const tintScale = {
    maxGain: Math.max(0, ...nets),
    maxLoss: Math.max(0, ...nets.map((n) => -n)),
  }
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  const selectedSummary = selected ? days[selected] || { spent: 0, income: 0, net: 0 } : null
  const selectedLabel = selected
    ? new Date(`${selected}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
    : ""

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Calendar</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Your daily balance: green when you earned more, red when you spent more.</p>
        </div>
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="h-10 w-10 rounded-full bg-slate-50 hover:bg-slate-100" aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="min-w-36 text-center font-bold text-slate-900" aria-live="polite">{monthLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="h-10 w-10 rounded-full bg-slate-50 hover:bg-slate-100" aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="ml-1 rounded-full border-slate-200 px-4">Today</Button>
        </div>
      </div>

      {/* Month totals */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6">
        {[
          { label: "Income", value: formatCurrency(totals.income), className: "text-emerald-600" },
          { label: "Spent", value: formatCurrency(totals.spent), className: "text-red-500" },
          { label: "Net", value: signedCurrency(totals.net), className: totals.net >= 0 ? "text-slate-900" : "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">{stat.label}</p>
            <p className={`mt-1 truncate text-sm font-bold sm:text-lg lg:text-2xl ${stat.className}`}>{monthLoading ? "…" : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        {/* Calendar grid */}
        <div
          className="@container min-w-0 rounded-3xl border border-slate-100 bg-white p-2 shadow-sm sm:p-5"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return
            const dx = e.changedTouches[0].clientX - touchStartX.current
            touchStartX.current = null
            if (Math.abs(dx) > 60) changeMonth(dx < 0 ? 1 : -1)
          }}
        >
          {monthError && (
            <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{monthError}</p>
          )}
          <div className="grid grid-cols-7 gap-1 @xl:gap-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 @md:text-xs">
                <span className="@md:hidden">{d[0]}</span>
                <span className="hidden @md:inline">{d}</span>
              </div>
            ))}

            {cells.map((day, i) => {
              if (!day) return <div key={`blank-${i}`} aria-hidden="true" />
              const key = dayKey(view.year, view.month, day)
              const info = days[key]
              const isToday = key === todayKey
              const isSelected = key === selected
              const net = info?.net || 0

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDay(key)}
                  aria-pressed={isSelected}
                  aria-label={`${day} ${monthLabel}${info ? `, income ${formatCurrency(info.income)}, spent ${formatCurrency(info.spent)}` : ", no entries"}`}
                  style={{ backgroundColor: cellTint(net, tintScale) }}
                  className={`relative flex aspect-square min-w-0 flex-col items-center justify-between rounded-xl p-1 text-left transition-all @xl:aspect-auto @xl:h-24 @xl:items-stretch @xl:rounded-2xl @xl:p-2 @3xl:h-28
                    ${info ? "" : "bg-slate-50/70"}
                    ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 @xl:ring-offset-2" : "hover:ring-2 hover:ring-slate-200"}
                    ${monthLoading ? "opacity-50" : ""}`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold @xl:h-6 @xl:w-6 @xl:text-sm
                    ${isToday ? "bg-blue-600 text-white" : "text-slate-700"}`}>
                    {day}
                  </span>

                  {info && (
                    <>
                      {/* Narrow calendar (phones, tablets beside the sidebar): just the day's net */}
                      <span className={`w-full truncate text-center text-[9px] font-bold leading-tight @md:text-[10px] @xl:hidden ${net >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                        {compact(net)}
                      </span>
                      {/* Wide calendar: income, spent and net */}
                      <span className="hidden min-w-0 space-y-0.5 text-[11px] font-semibold leading-tight @xl:block @3xl:text-xs">
                        {info.income > 0 && <span className="block truncate text-emerald-700">+{compact(info.income, false)}</span>}
                        {info.spent > 0 && <span className="block truncate text-red-600">−{compact(info.spent, false)}</span>}
                        {/* Net only adds information when the day has both income and spending */}
                        {info.income > 0 && info.spent > 0 && (
                          <span className={`block truncate border-t border-black/10 pt-0.5 font-bold ${net >= 0 ? "text-emerald-800" : "text-red-700"}`}>
                            {compact(net)}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 sm:text-xs">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ backgroundColor: "rgba(34,197,94,.45)" }} /> Earned more</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ backgroundColor: "rgba(239,68,68,.45)" }} /> Spent more</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-100" /> No entries</span>
            <span className="hidden sm:inline">· Darker = bigger amount</span>
          </div>
        </div>

        {/* Selected day details */}
        <div ref={detailRef} className="min-w-0 scroll-mt-20 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 xl:sticky xl:top-24">
          {!selected ? (
            <p className="py-10 text-center text-sm text-slate-400">Tap a day to see its expenses and income.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedLabel}</h2>
                  <p className={`mt-0.5 text-sm font-bold ${selectedSummary.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {selectedSummary.net === 0 && !selectedSummary.spent ? "No balance change" : `${signedCurrency(selectedSummary.net)} net`}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  onClick={() => openAdd("expense", selected)}
                  className="h-10 rounded-xl"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Expense
                </Button>
                <Button
                  onClick={() => openAdd("income", selected)}
                  className="h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-600/90"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Income
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                {dayLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
                ) : dayData?.error ? (
                  <p className="py-6 text-center text-sm text-red-500">Couldn&apos;t load this day.</p>
                ) : !dayData?.expenses?.length && !dayData?.incomes?.length ? (
                  <p className="py-6 text-center text-sm text-slate-400">Nothing recorded on this day.</p>
                ) : (
                  <>
                    {dayData.incomes.map((income) => {
                      const source = getIncomeSource(income.source)
                      return (
                        <div key={income._id} className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${source.color}1a` }}>{source.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{source.label}</p>
                            {income.description && <p className="truncate text-xs text-slate-400">{income.description}</p>}
                          </div>
                          <span className="shrink-0 text-sm font-bold text-emerald-600">+{formatCurrency(income.amount)}</span>
                          <div className="flex shrink-0">
                            <button onClick={() => dispatch(openAddIncomeModal(income))} className="rounded-full p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600" aria-label="Edit income">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => requestDelete("income", income)} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete income">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {dayData.expenses.map((expense) => (
                      <div key={expense._id} className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${expense.categoryId?.color || "#64748b"}1a` }}>
                          {expense.categoryId?.icon || "🏷️"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {expense.categoryId?.name || "Uncategorized"}
                            {expense.subCategoryId?.name && <span className="font-normal text-slate-400"> · {expense.subCategoryId.name}</span>}
                          </p>
                          {expense.description && <p className="truncate text-xs text-slate-400">{expense.description}</p>}
                        </div>
                        <span className="shrink-0 text-sm font-bold text-red-500">−{formatCurrency(expense.amount)}</span>
                        <div className="flex shrink-0">
                          <button onClick={() => dispatch(openAddExpenseModal(expense))} className="rounded-full p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600" aria-label="Edit expense">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => requestDelete("expense", expense)} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete expense">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {deleteDialog}
    </div>
  )
}
