"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"
import { CalendarDays, ChevronRight, Loader2 } from "lucide-react"

import ExpenseForm from "@/components/expenses/ExpenseForm"
import IncomeForm from "@/components/income/IncomeForm"
import { TypeSwitch } from "@/components/expenses/AddExpenseModal"
import { formatCurrency } from "@/lib/utils"
import { localDateKey } from "@/lib/dates"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Totals for the day being added to, so the user sees the effect of each entry
function DaySummary({ dateKey }) {
  const refreshTrigger = useSelector((state) => state.ui.refreshTrigger)
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true
    fetch(`/api/calendar?date=${dateKey}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => active && setData(json ? { key: dateKey, ...json } : { key: dateKey, expenses: [], incomes: [] }))
      .catch(() => active && setData({ key: dateKey, expenses: [], incomes: [] }))
    return () => {
      active = false
    }
  }, [dateKey, refreshTrigger])

  const loading = data?.key !== dateKey
  const spent = (data?.expenses || []).reduce((sum, e) => sum + e.amount, 0)
  const earned = (data?.incomes || []).reduce((sum, i) => sum + i.amount, 0)
  const count = (data?.expenses?.length || 0) + (data?.incomes?.length || 0)
  const isToday = dateKey === localDateKey()
  const label = isToday
    ? "Today"
    : new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })

  return (
    <Link
      href="/calendar"
      className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50 sm:p-5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <CalendarDays className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="block truncate text-xs text-slate-500">
          {loading ? "Loading…" : count === 0 ? "Nothing recorded yet" : `${count} entr${count === 1 ? "y" : "ies"}`}
        </span>
      </span>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
      ) : (
        <span className="text-right text-sm font-bold leading-tight">
          <span className="block text-red-500">−{formatCurrency(spent)}</span>
          {earned > 0 && <span className="block text-emerald-600">+{formatCurrency(earned)}</span>}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </Link>
  )
}

function AddScreen({ initialType, presetDate }) {
  const [type, setType] = useState(initialType)
  // Bumped after each save so the form starts fresh for the next entry
  const [formKey, setFormKey] = useState(0)
  const isIncome = type === "income"
  const dateKey = presetDate || localDateKey()
  const next = () => setFormKey((k) => k + 1)

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-6 sm:space-y-6">
      <div className="px-1">
        <p className="text-sm font-medium text-slate-500">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {isIncome ? "What did you earn?" : "What did you spend?"}
        </h1>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <TypeSwitch isIncome={isIncome} onChange={setType} className="mb-5" />
        {isIncome ? (
          <IncomeForm key={`income-${formKey}`} presetDate={presetDate} onSaved={next} />
        ) : (
          <ExpenseForm key={`expense-${formKey}`} presetDate={presetDate} onSaved={next} />
        )}
      </div>

      <DaySummary dateKey={dateKey} />
    </div>
  )
}

function AddScreenFromUrl() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type") === "income" ? "income" : "expense"
  const date = searchParams.get("date")
  const presetDate = date && DATE_RE.test(date) ? date : null
  // Remount when the URL asks for a different type/date (e.g. "+ Income" from the calendar)
  return <AddScreen key={`${type}|${presetDate}`} initialType={type} presetDate={presetDate} />
}

// Home screen on phones and tablets: add an expense or income in as few taps as possible
export default function AddPage() {
  return (
    <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AddScreenFromUrl />
    </Suspense>
  )
}
