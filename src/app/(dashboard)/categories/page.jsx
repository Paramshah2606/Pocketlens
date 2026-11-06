"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Loader2, Lock, Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import EmojiPicker from "@/components/EmojiPicker"

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#f43f5e", "#64748b"]

// Defaults are shared by everyone and can't be changed; anything else returned is the user's own
const isOwn = (cat) => !cat.isDefault && Boolean(cat.userId)

async function apiError(res, fallback) {
  const body = await res.json().catch(() => ({}))
  return body.error || fallback
}

// ─── Create / edit form (top-level category or sub-category) ───────────────
function CategoryForm({ initial, isSub, parentName, onCancel, onSaved }) {
  const [name, setName] = useState(initial?.name || "")
  const [icon, setIcon] = useState(initial?.icon || (isSub ? "✨" : "🏷️"))
  const [color, setColor] = useState(initial?.color || COLORS[6])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      await onSaved({ name, icon, ...(isSub ? {} : { color }) })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
      <p className="text-sm font-semibold text-slate-700">
        {initial ? "Edit" : "New"} {isSub ? `sub-category${parentName ? ` in ${parentName}` : ""}` : "category"}
      </p>
      <div className="space-y-1">
        <Label htmlFor="category-name" className="text-xs text-slate-600">Name</Label>
        <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-white" placeholder={isSub ? "e.g. Uber" : "e.g. Subscriptions"} required maxLength={40} autoFocus />
      </div>
      <div className="space-y-1">
        <Label htmlFor="category-icon" className="text-xs text-slate-600">Icon</Label>
        <EmojiPicker id="category-icon" value={icon} onChange={setIcon} />
      </div>
      {!isSub && (
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-600">Color</Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-offset-2 ring-slate-400" : "hover:scale-110"}`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
              />
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="h-10 flex-1 rounded-xl sm:flex-none sm:px-6">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="h-10 rounded-xl">Cancel</Button>
      </div>
    </form>
  )
}

// ─── Delete confirmation (asks where to move expenses when needed) ─────────
function DeleteDialog({ target, categories, onClose, onDeleted }) {
  const { category, isSub, parentName } = target
  const [expenseCount, setExpenseCount] = useState(null) // set when the API says expenses exist
  const [moveTo, setMoveTo] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const moveOptions = categories.filter((c) => c._id !== category._id)

  const confirm = async () => {
    setBusy(true)
    setError("")
    try {
      const params = new URLSearchParams({ categoryId: category._id })
      if (moveTo) params.set("moveTo", moveTo)
      const res = await fetch(`/api/categories?${params}`, { method: "DELETE" })
      if (res.status === 409) {
        const body = await res.json()
        setExpenseCount(body.expenseCount)
        setBusy(false)
        return
      }
      if (!res.ok) throw new Error(await apiError(res, "Failed to delete"))
      onDeleted()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="delete-cat-title">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h2 id="delete-cat-title" className="text-lg font-bold">
            Delete {category.icon} {category.name}?
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {expenseCount ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-slate-600">
              <strong>{expenseCount}</strong> expense{expenseCount === 1 ? "" : "s"} use this category. Choose where to move {expenseCount === 1 ? "it" : "them"}:
            </p>
            <select
              value={moveTo}
              onChange={(e) => setMoveTo(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base sm:text-sm font-medium"
            >
              <option value="">Select a category…</option>
              {moveOptions.map((c) => (
                <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500">This category&apos;s budgets and sub-categories will also be deleted.</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            {isSub
              ? `Expenses in this sub-category will stay in ${parentName}, without a sub-category.`
              : "Its sub-categories and budgets will be deleted too. This can't be undone."}
          </p>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex gap-2">
          <Button variant="ghost" onClick={onClose} className="h-11 flex-1 rounded-xl">Cancel</Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={busy || (expenseCount > 0 && !moveTo)}
            className="h-11 flex-1 rounded-xl"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : expenseCount ? "Move & delete" : "Delete"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function IconButton({ label, onClick, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors ${danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-blue-50 hover:text-blue-600"}`}
    >
      {children}
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [expanded, setExpanded] = useState(() => new Set())
  // What the inline form is doing: { mode: 'create' } | { mode: 'edit', category } |
  // { mode: 'create-sub', parent } | { mode: 'edit-sub', parent, category }
  const [form, setForm] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchCategories = async () => {
    const res = await fetch("/api/categories")
    if (!res.ok) throw new Error(await apiError(res, "Failed to load categories"))
    const data = await res.json()
    return data.categories || []
  }

  const load = () =>
    fetchCategories()
      .then((list) => {
        setCategories(list)
        setLoadError("")
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setIsLoading(false))

  useEffect(() => {
    let active = true
    fetchCategories()
      .then((list) => active && setCategories(list))
      .catch((err) => active && setLoadError(err.message))
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [])

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const save = async (values) => {
    const isEdit = form.mode === "edit" || form.mode === "edit-sub"
    const body = isEdit
      ? { categoryId: form.category._id, ...values }
      : { ...values, ...(form.parent ? { parentCategoryId: form.parent._id } : {}) }
    const res = await fetch("/api/categories", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(await apiError(res, "Failed to save"))
    if (form.parent) setExpanded((prev) => new Set(prev).add(form.parent._id))
    setForm(null)
    await load()
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const own = categories.filter(isOwn)
  const defaults = categories.filter((c) => !isOwn(c))

  const renderCategory = (cat) => {
    const editable = isOwn(cat)
    const isOpen = expanded.has(cat._id)
    const subs = cat.subCategories || []
    const formHere = form && (form.category?._id === cat._id || form.parent?._id === cat._id)

    return (
      <li key={cat._id} className="rounded-2xl border border-slate-100 bg-white">
        <div className="flex items-center gap-3 p-3 sm:p-4">
          <button type="button" onClick={() => toggle(cat._id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={isOpen}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl" style={{ backgroundColor: `${cat.color}1f` }}>
              {cat.icon}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="truncate font-semibold text-slate-900">{cat.name}</span>
                {!editable && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    <Lock className="h-2.5 w-2.5" /> Default
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500">{subs.length} sub-categor{subs.length === 1 ? "y" : "ies"}</span>
            </span>
            <ChevronDown className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
          <div className="flex shrink-0 items-center">
            <IconButton label={`Add sub-category to ${cat.name}`} onClick={() => setForm({ mode: "create-sub", parent: cat })}>
              <Plus className="h-4 w-4" />
            </IconButton>
            {editable && (
              <>
                <IconButton label={`Edit ${cat.name}`} onClick={() => setForm({ mode: "edit", category: cat })}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton label={`Delete ${cat.name}`} danger onClick={() => setDeleteTarget({ category: cat })}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </>
            )}
          </div>
        </div>

        {formHere && (
          <div className="px-3 pb-3 sm:px-4 sm:pb-4">
            <CategoryForm
              key={`${form.mode}-${form.category?._id || form.parent?._id}`}
              initial={form.category}
              isSub={form.mode === "create-sub" || form.mode === "edit-sub"}
              parentName={form.parent?.name}
              onCancel={() => setForm(null)}
              onSaved={save}
            />
          </div>
        )}

        {isOpen && (
          <div className="border-t border-slate-50 px-3 py-3 sm:px-4">
            {subs.length === 0 ? (
              <p className="text-sm text-slate-400">No sub-categories yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {subs.map((sub) => (
                  <li key={sub._id} className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-sm">
                    <span>{sub.icon}</span>
                    <span className="font-medium text-slate-700">{sub.name}</span>
                    {isOwn(sub) ? (
                      <>
                        <button type="button" onClick={() => setForm({ mode: "edit-sub", parent: cat, category: sub })} className="ml-1 rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-blue-600" aria-label={`Edit ${sub.name}`}>
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget({ category: sub, isSub: true, parentName: cat.name })} className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-red-600" aria-label={`Delete ${sub.name}`}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <Lock className="mx-1.5 h-3 w-3 text-slate-300" aria-label="Default" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-0 pb-10 sm:px-4">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Categories</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">Add, edit or remove the categories you use for expenses.</p>
        </div>
        <Button onClick={() => setForm({ mode: "create" })} className="shrink-0 rounded-full px-4 shadow-sm">
          <Plus className="mr-1.5 h-4 w-4" /> New
        </Button>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {loadError} <button onClick={load} className="ml-2 font-semibold underline">Retry</button>
        </div>
      )}

      {form?.mode === "create" && (
        <CategoryForm onCancel={() => setForm(null)} onSaved={save} />
      )}

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-slate-500">Your categories</h2>
        {own.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            You haven&apos;t created any categories yet. Tap <strong>New</strong> to add one.
          </div>
        ) : (
          <ul className="space-y-3">{own.map(renderCategory)}</ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Default categories</h2>
          <p className="mt-0.5 text-xs text-slate-400">These can&apos;t be edited, but you can add your own sub-categories to them.</p>
        </div>
        <ul className="space-y-3">{defaults.map(renderCategory)}</ul>
      </section>

      {deleteTarget && (
        <DeleteDialog
          target={deleteTarget}
          categories={categories}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null)
            load()
          }}
        />
      )}
    </div>
  )
}
