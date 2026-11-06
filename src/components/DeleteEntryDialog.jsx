"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useDispatch } from "react-redux"
import { Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getIncomeSource } from "@/lib/incomeSources"
import { triggerRefresh } from "@/store/uiSlice"
import { toast } from "@/lib/toast"

// Name/icon shown in the confirmation for an expense or income entry
function describe(kind, entry) {
  if (kind === "income") {
    const source = getIncomeSource(entry.source)
    return { icon: source.icon, name: source.label, color: source.color }
  }
  const cat = entry.categoryId && typeof entry.categoryId === "object" ? entry.categoryId : null
  return { icon: cat?.icon || "🏷️", name: cat?.name || "Expense", color: cat?.color || "#64748b" }
}

function ConfirmDeleteDialog({ kind, entry, busy, error, onCancel, onConfirm }) {
  const { icon, name, color } = describe(kind, entry)
  const label = kind === "income" ? "income" : "expense"

  // Escape closes the dialog
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onCancel()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [busy, onCancel])

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-900/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center"
      onClick={() => !busy && onCancel()}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-entry-title"
      aria-describedby="delete-entry-desc"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-5 w-5 text-red-600" />
        </div>
        <h2 id="delete-entry-title" className="mt-4 text-center text-lg font-bold">Delete this {label}?</h2>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${color}1f` }}>{icon}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-slate-500">
              {entry.description ? `${entry.description} · ` : ""}{formatDate(entry.date)}
            </p>
          </div>
          <span className={`shrink-0 text-sm font-bold ${kind === "income" ? "text-emerald-600" : "text-slate-900"}`}>
            {formatCurrency(entry.amount)}
          </span>
        </div>

        <p id="delete-entry-desc" className="mt-3 text-center text-sm text-slate-500">This can&apos;t be undone.</p>
        {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={busy} className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200" autoFocus>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy} className="h-11 rounded-xl">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Shared delete flow for expenses and income:
//   const { requestDelete, deleteDialog } = useDeleteEntry()
//   <button onClick={() => requestDelete("expense", expense)} />  …  {deleteDialog}
// On success it refreshes every list (via triggerRefresh) and calls onDeleted.
export function useDeleteEntry({ onDeleted } = {}) {
  const dispatch = useDispatch()
  const [target, setTarget] = useState(null) // { kind: "expense" | "income", entry }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const requestDelete = (kind, entry) => {
    setError("")
    setTarget({ kind, entry })
  }

  const cancel = () => setTarget(null)

  const confirm = async () => {
    setBusy(true)
    setError("")
    try {
      const { kind, entry } = target
      const url = kind === "income" ? `/api/income/${entry._id}` : `/api/expenses/${entry._id}`
      const res = await fetch(url, { method: "DELETE" })
      // 404 means it's already gone, which is what the user wanted
      if (!res.ok && res.status !== 404) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Couldn't delete. Please try again.")
      }
      setTarget(null)
      toast.success(kind === "income" ? "Income deleted" : "Expense deleted")
      dispatch(triggerRefresh())
      onDeleted?.(kind, entry)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const deleteDialog = target ? (
    <ConfirmDeleteDialog
      kind={target.kind}
      entry={target.entry}
      busy={busy}
      error={error}
      onCancel={cancel}
      onConfirm={confirm}
    />
  ) : null

  return { requestDelete, deleteDialog }
}
