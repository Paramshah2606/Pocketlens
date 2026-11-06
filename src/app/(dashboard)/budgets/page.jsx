"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useForm } from "react-hook-form"
import { Plus, Loader2, AlertTriangle, CheckCircle2, Target, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { localMonthKey } from "@/lib/dates"
import { toast } from "@/lib/toast"
import { useSelector } from "react-redux"

async function getJson(url) {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || "Failed to load")
  return data
}

function DeleteBudgetDialog({ budget, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/budgets?id=${budget._id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Couldn't delete the budget")
      }
      toast.success("Budget deleted")
      onDeleted()
    } catch (error) {
      toast.error(error.message)
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-900/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center" onClick={() => !busy && onClose()} role="alertdialog" aria-modal="true" aria-labelledby="delete-budget-title">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="delete-budget-title" className="text-lg font-bold">Delete the {budget.categoryId?.name} budget?</h2>
        <p className="mt-2 text-sm text-slate-500">Your expenses won&apos;t be affected, only the {formatCurrency(budget.amount)} monthly limit.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy} className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200" autoFocus>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={busy} className="h-11 rounded-xl">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState(null) // budget being edited
  const [deleting, setDeleting] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const refreshTrigger = useSelector((state) => state.ui.refreshTrigger)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const month = localMonthKey()
  const now = new Date()
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  useEffect(() => {
    let active = true
    Promise.all([getJson(`/api/budgets?month=${month}`), getJson("/api/categories")])
      .then(([budData, catData]) => {
        if (!active) return
        setBudgets(budData.budgets || [])
        setCategories(catData.categories || [])
        setLoadError("")
      })
      .catch((error) => active && setLoadError(error.message))
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [refreshTrigger, reloadKey, month])

  const reload = () => setReloadKey((k) => k + 1)

  const openNew = () => {
    setEditing(null)
    reset({ categoryId: "", amount: "" })
    setIsFormOpen(true)
  }

  const openEdit = (budget) => {
    setEditing(budget)
    reset({ categoryId: budget.categoryId?._id, amount: budget.amount })
    setIsFormOpen(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditing(null)
    reset({ categoryId: "", amount: "" })
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The category select is disabled while editing, and disabled fields aren't submitted
          categoryId: editing ? editing.categoryId?._id : data.categoryId,
          amount: Number(data.amount),
          month,
        })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || "Failed to save budget")

      toast.success(editing ? "Budget updated" : "Budget saved")
      closeForm()
      reload()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Categories that don't have a budget yet (plus the one being edited)
  const budgetedIds = new Set(budgets.map((b) => b.categoryId?._id))
  const availableCategories = categories.filter((c) => !budgetedIds.has(c._id) || c._id === editing?.categoryId?._id)

  return (
    <div className="space-y-6 relative max-w-5xl mx-auto pb-10 px-0 sm:px-4">
      <div className="flex items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">Budgets</h1>
          <p className="text-slate-500 text-xs sm:text-base mt-0.5 sm:mt-1">Monthly limits for {monthLabel}.</p>
        </div>
        {!isFormOpen && (
          <Button size="sm" onClick={openNew} className="rounded-full h-9 sm:h-12 px-4 sm:px-6 shadow-md shadow-blue-500/20 shrink-0">
            <Plus className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> <span className="hidden sm:inline">New Budget</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}
      </div>

      {isFormOpen && (
        <Card className="rounded-3xl border-blue-100 bg-gradient-to-b from-blue-50/50 to-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4">
          <CardHeader className="border-b border-blue-100/50 bg-white/50 pb-4">
            <CardTitle className="text-lg flex items-center text-blue-900">
              <Target className="mr-2 h-5 w-5 text-blue-500" />
              {editing ? `Edit ${editing.categoryId?.name} budget` : "Set a new budget"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex-1 space-y-2">
                <Label htmlFor="budget-category" className="text-slate-700 font-semibold">Category</Label>
                <select
                  id="budget-category"
                  disabled={Boolean(editing)}
                  className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white text-slate-900 px-4 py-2 text-base sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all disabled:bg-slate-50 disabled:text-slate-500"
                  {...register("categoryId", { required: "Choose a category" })}
                >
                  <option value="">Select a category</option>
                  {availableCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="budget-amount" className="text-slate-700 font-semibold">Monthly limit</Label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-500 font-medium">₹</span>
                  <Input
                    id="budget-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="pl-8 h-12 rounded-2xl bg-white border-slate-200 focus-visible:ring-primary/20"
                    {...register("amount", {
                      required: "Enter a limit",
                      validate: (v) => Number(v) > 0 || "Limit must be greater than 0",
                    })}
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
              </div>
              <div className="flex gap-3 sm:w-auto sm:pt-7">
                <Button type="button" variant="ghost" onClick={closeForm} className="h-12 flex-1 sm:flex-none rounded-xl text-slate-600 hover:bg-slate-100">Cancel</Button>
                <Button type="submit" className="h-12 flex-1 sm:flex-none rounded-xl px-8 shadow-sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : editing ? "Update" : "Save Budget"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {loadError} <button onClick={reload} className="ml-2 font-semibold underline">Retry</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {budgets.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 sm:p-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm mb-6 text-slate-400">
                <Target className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No budgets yet</h3>
              <p className="text-slate-500 mb-8 max-w-sm mt-2 leading-relaxed">
                Create budgets to keep your spending in check and reach your financial goals faster.
              </p>
              {!isFormOpen && (
                <Button onClick={openNew} className="rounded-full h-12 px-8 shadow-sm">
                  <Plus className="mr-2 h-5 w-5" /> Create First Budget
                </Button>
              )}
            </div>
          ) : (
            budgets.map((budget) => {
              const used = budget.percentageUsed || 0
              const percent = Math.min(used, 100)
              const remaining = budget.amount - (budget.spent || 0)
              let statusColor = "bg-gradient-to-r from-emerald-400 to-emerald-500"
              let statusBg = "bg-emerald-50 border-emerald-100 text-emerald-700"
              let StatusIcon = CheckCircle2

              if (used >= 100) {
                statusColor = "bg-gradient-to-r from-red-400 to-red-500"
                statusBg = "bg-red-50 border-red-100 text-red-700"
                StatusIcon = AlertTriangle
              } else if (used >= 80) {
                statusColor = "bg-gradient-to-r from-amber-400 to-amber-500"
                statusBg = "bg-amber-50 border-amber-100 text-amber-700"
                StatusIcon = AlertTriangle
              }

              return (
                <Card key={budget._id} className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4 pt-5 sm:pt-6 px-5 sm:px-6">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div
                        className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl shadow-sm shrink-0"
                        style={{ backgroundColor: `${budget.categoryId?.color}15`, color: budget.categoryId?.color }}
                      >
                        <span className="text-xl sm:text-2xl">{budget.categoryId?.icon || "🏷️"}</span>
                      </div>
                      <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 truncate">{budget.categoryId?.name}</CardTitle>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <div className={`flex items-center rounded-full px-2 sm:px-3 py-1 border text-[10px] sm:text-xs font-bold ${statusBg}`}>
                        <StatusIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        {used.toFixed(0)}%
                      </div>
                      <button onClick={() => openEdit(budget)} className="rounded-full p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600" aria-label={`Edit ${budget.categoryId?.name} budget`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleting(budget)} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${budget.categoryId?.name} budget`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                    <div className="mb-3 flex items-end justify-between gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {formatCurrency(budget.spent || 0)}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-400 mb-1 whitespace-nowrap">
                        of {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner" role="progressbar" aria-valuenow={Math.round(used)} aria-valuemin={0} aria-valuemax={100} aria-label={`${budget.categoryId?.name} budget used`}>
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${statusColor}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className={`mt-3 text-sm font-medium flex items-center ${used >= 100 ? "text-red-600" : used >= 80 ? "text-amber-600" : "text-slate-500"}`}>
                      {used >= 100 ? (
                        <><AlertTriangle className="mr-1.5 h-4 w-4 shrink-0" /> {formatCurrency(-remaining)} over budget</>
                      ) : (
                        <>
                          {used >= 80 && <AlertTriangle className="mr-1.5 h-4 w-4 shrink-0" />}
                          {formatCurrency(remaining)} left · about {formatCurrency(remaining / daysLeft)}/day for {daysLeft} day{daysLeft === 1 ? "" : "s"}
                        </>
                      )}
                    </p>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {deleting && (
        <DeleteBudgetDialog
          budget={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null)
            reload()
          }}
        />
      )}
    </div>
  )
}
