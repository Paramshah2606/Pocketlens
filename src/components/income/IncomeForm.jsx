"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Loader2, Trash2 } from "lucide-react"
import { useDispatch } from "react-redux"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { INCOME_SOURCES } from "@/lib/incomeSources"
import { closeAddExpenseModal, triggerRefresh } from "@/store/uiSlice"
import { useDeleteEntry } from "@/components/DeleteEntryDialog"
import { localDateKey, entryDateKey } from "@/lib/dates"
import { toast } from "@/lib/toast"

const today = () => localDateKey()

// Add / edit an income entry (salary, freelance, ...). Rendered inside the add modal.
export default function IncomeForm({ editingIncome, presetDate }) {
  const dispatch = useDispatch()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const { requestDelete, deleteDialog } = useDeleteEntry({
    onDeleted: () => dispatch(closeAddExpenseModal()),
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { amount: "", source: "salary", description: "", date: today() },
  })
  const watchSource = watch("source")

  useEffect(() => {
    if (editingIncome) {
      reset({
        amount: editingIncome.amount,
        source: editingIncome.source || "other",
        description: editingIncome.description || "",
        date: entryDateKey(editingIncome.date),
      })
    } else {
      reset({ amount: "", source: "salary", description: "", date: presetDate || today() })
    }
  }, [editingIncome, presetDate, reset])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch(editingIncome ? `/api/income/${editingIncome._id}` : "/api/income", {
        method: editingIncome ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Failed to ${editingIncome ? "update" : "add"} income`)
      }
      toast.success(editingIncome ? "Income updated" : "Income added")
      dispatch(triggerRefresh())
      dispatch(closeAddExpenseModal())
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in fade-in zoom-in-95">
      <div className="space-y-2">
        <Label htmlFor="income-amount" className="text-slate-700">Amount</Label>
        <div className="relative">
          <span className="absolute left-4 top-3 text-emerald-600 font-semibold text-lg">₹</span>
          <Input
            id="income-amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            className="pl-9 h-14 text-2xl font-bold rounded-2xl bg-emerald-50/40 border-emerald-100 text-emerald-700 focus-visible:ring-emerald-500/20"
            placeholder="0.00"
            autoFocus
            {...register("amount", {
              required: "Amount is required",
              validate: (v) => Number(v) > 0 || "Amount must be greater than 0",
            })}
          />
        </div>
        {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700">Source</Label>
        <div className="grid grid-cols-4 gap-2">
          {INCOME_SOURCES.map((src) => (
            <button
              key={src.id}
              type="button"
              onClick={() => setValue("source", src.id)}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                watchSource === src.id
                  ? "border-transparent bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/30"
                  : "border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200"
              }`}
            >
              <span className="text-2xl mb-1">{src.icon}</span>
              <span className="truncate text-[10px] font-semibold w-full text-center">{src.label}</span>
            </button>
          ))}
        </div>
        <input type="hidden" {...register("source")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-description" className="text-slate-700">Description (Optional)</Label>
        <Input
          id="income-description"
          className="h-11 rounded-xl bg-slate-50/50 border-slate-200"
          placeholder="e.g. November salary, Client project"
          {...register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-date" className="text-slate-700">Date</Label>
        <Input
          id="income-date"
          type="date"
          className="h-11 rounded-xl bg-slate-50/50 border-slate-200"
          {...register("date", { required: "Date is required" })}
        />
      </div>

      {submitError && <p className="text-sm text-red-500">{submitError}</p>}

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full h-12 rounded-xl text-base font-semibold bg-emerald-600 hover:bg-emerald-600/90 text-white shadow-md shadow-emerald-500/20"
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (editingIncome ? "Update Income" : "Save Income")}
        </Button>
        {editingIncome && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => requestDelete("income", editingIncome)}
            className="mt-2 w-full h-11 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete income
          </Button>
        )}
      </div>
      {deleteDialog}
    </form>
  )
}
