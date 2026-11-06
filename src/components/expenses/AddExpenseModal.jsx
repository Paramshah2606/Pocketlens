"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"

import { Button } from "@/components/ui/button"
import { closeAddExpenseModal, setModalType } from "@/store/uiSlice"
import ExpenseForm from "@/components/expenses/ExpenseForm"
import IncomeForm from "@/components/income/IncomeForm"

// Add/edit pop-up: a bottom sheet on small screens, a centred dialog on larger ones.
// Used for quick-add on desktop and for editing entries on every device (on phones and
// tablets, *adding* happens on the full /add screen instead).
export default function AddExpenseModal() {
  const dispatch = useDispatch()
  const isOpen = useSelector((state) => state.ui.isAddExpenseModalOpen)
  const editingExpense = useSelector((state) => state.ui.editingExpense)
  const editingIncome = useSelector((state) => state.ui.editingIncome)
  const modalType = useSelector((state) => state.ui.modalType)
  const presetDate = useSelector((state) => state.ui.presetDate)
  const isIncome = modalType === "income"
  const close = () => dispatch(closeAddExpenseModal())

  // Escape closes the sheet (unless a confirmation dialog is open on top of it)
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key !== "Escape" || document.querySelector('[role="alertdialog"]')) return
      dispatch(closeAddExpenseModal())
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, dispatch])

  if (!isOpen) return null

  const isEditing = Boolean(editingExpense || editingIncome)
  const title = isIncome
    ? (editingIncome ? "Edit Income" : "Add Income")
    : (editingExpense ? "Edit Expense" : "Add Expense")
  const subtitle = isIncome
    ? (editingIncome ? "Update your income details" : "Record salary or any money you received")
    : (editingExpense ? "Update your transaction details" : "Track a new transaction")

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm transition-all md:items-center md:justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-sheet-title"
        className="w-full max-h-[92dvh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom-full rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl md:max-w-lg md:rounded-3xl md:pb-6 border border-slate-100"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 id="add-sheet-title" className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          <Button aria-label="Close" variant="ghost" size="icon" className="rounded-full bg-slate-100 hover:bg-slate-200" onClick={close}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!isEditing && (
          <TypeSwitch isIncome={isIncome} onChange={(type) => dispatch(setModalType(type))} />
        )}

        {isIncome ? (
          <IncomeForm editingIncome={editingIncome} presetDate={presetDate} onSaved={close} onDeleted={close} autoFocus />
        ) : (
          <ExpenseForm editingExpense={editingExpense} presetDate={presetDate} onSaved={close} onDeleted={close} onNavigate={close} autoFocus />
        )}
      </div>
    </div>
  )
}

// Expense | Income segmented control, shared with the Add screen
export function TypeSwitch({ isIncome, onChange, className = "mb-6" }) {
  return (
    <div className={`grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 ${className}`} role="tablist" aria-label="Transaction type">
      <button
        type="button"
        role="tab"
        aria-selected={!isIncome}
        onClick={() => onChange("expense")}
        className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${!isIncome ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
      >
        Expense
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={isIncome}
        onClick={() => onChange("income")}
        className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${isIncome ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
      >
        Income
      </button>
    </div>
  )
}
