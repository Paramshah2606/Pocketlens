"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Plus, Loader2, AlertTriangle, CheckCircle2, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { useSelector } from "react-redux"

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const refreshTrigger = useSelector((state) => state.ui.refreshTrigger)
  const { register, handleSubmit, reset } = useForm()

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [budRes, catRes] = await Promise.all([
        fetch("/api/budgets"),
        fetch("/api/categories")
      ])
      
      const budData = await budRes.json()
      const catData = await catRes.json()
      
      setBudgets(budData.budgets || [])
      setCategories(catData.categories || [])
    } catch (error) {
      console.error("Failed to fetch budgets", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: data.categoryId,
          amount: Number(data.amount),
          period: "monthly"
        })
      })
      
      if (!res.ok) throw new Error("Failed to save budget")
      
      await fetchData() // Refresh to get calculated percentages
      setIsFormOpen(false)
      reset()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Budgets</h1>
          <p className="text-slate-500 mt-1">Set limits and track your spending goals.</p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)} className="rounded-full h-12 px-6 shadow-md shadow-blue-500/20">
            <Plus className="mr-2 h-5 w-5" /> New Budget
          </Button>
        )}
      </div>

      {isFormOpen && (
        <Card className="rounded-3xl border-blue-100 bg-gradient-to-b from-blue-50/50 to-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4">
          <CardHeader className="border-b border-blue-100/50 bg-white/50 pb-4">
            <CardTitle className="text-lg flex items-center text-blue-900">
              <Target className="mr-2 h-5 w-5 text-blue-500" />
              Set a new Budget
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label className="text-slate-700 font-semibold">Category</Label>
                <select 
                  className="flex h-12 w-full rounded-2xl border border-slate-200 bg-white text-slate-900 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                  {...register("categoryId", { required: true })}
                >
                  <option value="" className="text-slate-500">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id} className="text-slate-900">{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-slate-700 font-semibold">Monthly Limit (₹)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500 font-medium">₹</span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    className="pl-8 h-12 rounded-2xl bg-white border-slate-200 focus-visible:ring-primary/20"
                    {...register("amount", { required: true })} 
                  />
                </div>
              </div>
              <div className="flex gap-3 sm:w-auto pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="h-12 rounded-xl text-slate-600 hover:bg-slate-100">Cancel</Button>
                <Button type="submit" className="h-12 rounded-xl px-8 shadow-sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Budget"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {budgets.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm mb-6 text-slate-400">
                <Target className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No budgets yet</h3>
              <p className="text-slate-500 mb-8 max-w-sm mt-2 leading-relaxed">
                Create budgets to keep your spending in check and reach your financial goals faster.
              </p>
              {!isFormOpen && (
                <Button onClick={() => setIsFormOpen(true)} className="rounded-full h-12 px-8 shadow-sm">
                  <Plus className="mr-2 h-5 w-5" /> Create First Budget
                </Button>
              )}
            </div>
          ) : (
            budgets.map((budget) => {
              const percent = Math.min(budget.percentageUsed || 0, 100)
              let statusColor = "bg-gradient-to-r from-emerald-400 to-emerald-500"
              let statusBg = "bg-emerald-50 border-emerald-100 text-emerald-700"
              let StatusIcon = CheckCircle2

              if (percent >= 100) {
                statusColor = "bg-gradient-to-r from-red-400 to-red-500"
                statusBg = "bg-red-50 border-red-100 text-red-700"
                StatusIcon = AlertTriangle
              } else if (percent >= 80) {
                statusColor = "bg-gradient-to-r from-amber-400 to-amber-500"
                statusBg = "bg-amber-50 border-amber-100 text-amber-700"
                StatusIcon = AlertTriangle
              }

              return (
                <Card key={budget._id} className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
                    <div className="flex items-center gap-4">
                      <div 
                        className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
                        style={{ backgroundColor: `${budget.categoryId?.color}15`, color: budget.categoryId?.color }}
                      >
                        <span className="text-2xl">{budget.categoryId?.icon || "🏷️"}</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">{budget.categoryId?.name}</CardTitle>
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 border text-xs font-bold ${statusBg}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {percent.toFixed(0)}%
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0">
                    <div className="mb-3 flex items-end justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                          {formatCurrency(budget.spent || 0)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-400 mb-1">
                        of {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${statusColor}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {percent >= 80 && percent < 100 && (
                      <p className="mt-3 text-sm font-medium text-amber-600 flex items-center">
                        <AlertTriangle className="mr-1.5 h-4 w-4" /> You're nearing your limit.
                      </p>
                    )}
                    {percent >= 100 && (
                      <p className="mt-3 text-sm font-medium text-red-600 flex items-center">
                        <AlertTriangle className="mr-1.5 h-4 w-4" /> You've exceeded your budget.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
