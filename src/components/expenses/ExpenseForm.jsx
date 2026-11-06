"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import Link from "next/link"
import { X, Loader2, Settings2, Trash2, ArrowLeft } from "lucide-react"
import { useDispatch } from "react-redux"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { triggerRefresh } from "@/store/uiSlice"
import { useDeleteEntry } from "@/components/DeleteEntryDialog"
import EmojiPicker from "@/components/EmojiPicker"
import { localDateKey, entryDateKey } from "@/lib/dates"
import { toast } from "@/lib/toast"

const CATEGORY_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#f43f5e"]

// Add / edit an expense. Used by the Add screen (phones & tablets) and the add/edit
// pop-up (desktop, and editing everywhere).
//   onSaved()    – after a successful save (the pop-up closes, the Add screen resets)
//   onDeleted()  – after the entry being edited is deleted
//   onNavigate() – before following the "Manage" categories link
export default function ExpenseForm({ editingExpense = null, presetDate = null, onSaved, onDeleted, onNavigate, autoFocus = false }) {
  const dispatch = useDispatch()
  const { requestDelete, deleteDialog } = useDeleteEntry({ onDeleted })

  const [categories, setCategories] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatIcon, setNewCatIcon] = useState("🏷️")
  const [isSubmittingCat, setIsSubmittingCat] = useState(false)

  const [isCreatingSub, setIsCreatingSub] = useState(false)
  const [newSubName, setNewSubName] = useState("")
  const [newSubIcon, setNewSubIcon] = useState("✨")
  const [isSubmittingSub, setIsSubmittingSub] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: editingExpense
      ? {
          amount: editingExpense.amount,
          categoryId: editingExpense.categoryId?._id || editingExpense.categoryId || "",
          subCategoryId: editingExpense.subCategoryId?._id || editingExpense.subCategoryId || null,
          description: editingExpense.description || "",
          date: entryDateKey(editingExpense.date),
        }
      : { amount: "", categoryId: "", subCategoryId: null, description: "", date: presetDate || localDateKey() },
  })

  const watchCategoryId = watch("categoryId")
  const watchSubCategoryId = watch("subCategoryId")
  const selectedCategory = categories.find((c) => c._id === watchCategoryId) || null

  const loadCategories = async () => {
    const res = await fetch("/api/categories")
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Couldn't load categories")
    return data.categories || []
  }

  useEffect(() => {
    let active = true
    loadCategories()
      .then((list) => active && setCategories(list))
      .catch((error) => active && toast.error(error.message))
    return () => {
      active = false
    }
  }, [])

  const handleCategorySelect = (cat) => {
    setValue("categoryId", cat._id, { shouldValidate: true })
    setValue("subCategoryId", null) // reset subcategory when category changes
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(editingExpense ? `/api/expenses/${editingExpense._id}` : "/api/expenses", {
        method: editingExpense ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Failed to ${editingExpense ? "update" : "add"} expense`)
      }
      toast.success(editingExpense ? "Expense updated" : "Expense added")
      dispatch(triggerRefresh())
      onSaved?.()
    } catch (error) {
      toast.error(error.message || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    setIsSubmittingCat(true)
    const color = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, icon: newCatIcon, color }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Couldn't create the category")
      setCategories(await loadCategories())
      handleCategorySelect(data.category)
      setIsCreatingCategory(false)
      setNewCatName("")
      setNewCatIcon("🏷️")
      toast.success(`Category "${data.category.name}" created`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmittingCat(false)
    }
  }

  const handleCreateSubCategory = async (e) => {
    e.preventDefault()
    if (!selectedCategory) return
    setIsSubmittingSub(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSubName, icon: newSubIcon, parentCategoryId: selectedCategory._id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Couldn't create the sub-category")
      setCategories(await loadCategories())
      setValue("subCategoryId", data.category._id)
      setIsCreatingSub(false)
      setNewSubName("")
      setNewSubIcon("✨")
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmittingSub(false)
    }
  }

  if (isCreatingCategory) {
    return (
      <form onSubmit={handleCreateCategory} className="space-y-5 animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={() => setIsCreatingCategory(false)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to expense
        </button>
        <h3 className="text-lg font-bold text-slate-900">New category</h3>
        <div className="space-y-2">
          <Label htmlFor="new-category-name" className="text-slate-700">Category name</Label>
          <Input
            id="new-category-name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20"
            required
            maxLength={40}
            placeholder="e.g. Subscriptions, Gifts"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-category-icon" className="text-slate-700">Icon</Label>
          <EmojiPicker id="new-category-icon" value={newCatIcon} onChange={setNewCatIcon} />
          <p className="text-xs text-slate-500">Pick an emoji to represent this category.</p>
        </div>
        <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-md shadow-blue-500/20" disabled={isSubmittingCat}>
          {isSubmittingCat ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Category"}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in fade-in zoom-in-95">
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-slate-700">Amount</Label>
        <div className="relative">
          <span className="absolute left-4 top-3 text-slate-500 font-semibold text-lg">₹</span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            className="pl-9 h-14 text-2xl font-bold rounded-2xl bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 transition-all"
            placeholder="0.00"
            autoFocus={autoFocus}
            {...register("amount", {
              required: "Amount is required",
              validate: (v) => Number(v) > 0 || "Amount must be greater than 0",
            })}
          />
        </div>
        {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-slate-700">Category</Label>
          <Link
            href="/categories"
            onClick={() => onNavigate?.()}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Settings2 className="h-3.5 w-3.5" /> Manage
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              aria-pressed={watchCategoryId === cat._id}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                watchCategoryId === cat._id
                  ? "border-transparent bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10 ring-2 ring-blue-500/20"
                  : "border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200"
              }`}
            >
              <span className="text-2xl mb-1">{cat.icon || "🏷️"}</span>
              <span className="truncate text-[10px] font-semibold w-full text-center">{cat.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCreatingCategory(true)}
            className="flex flex-col items-center justify-center rounded-2xl border p-3 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 text-slate-500 transition-all"
          >
            <span className="text-2xl mb-1">➕</span>
            <span className="truncate text-[10px] font-semibold w-full text-center">Add Yours</span>
          </button>
        </div>
        <input type="hidden" {...register("categoryId", { required: "Please select a category" })} />
        {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
      </div>

      {selectedCategory && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
          <Label className="text-slate-700">Sub-category</Label>
          {isCreatingSub ? (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-2">
              <div className="flex items-end gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <Label htmlFor="new-sub-name" className="text-[10px]">Name</Label>
                  <Input id="new-sub-name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="h-9 bg-white" placeholder="e.g. Uber" required maxLength={40} />
                </div>
                <Button onClick={handleCreateSubCategory} type="button" disabled={isSubmittingSub} size="sm" className="h-9 rounded-lg px-4">
                  {isSubmittingSub ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
                <Button onClick={() => setIsCreatingSub(false)} type="button" variant="ghost" size="sm" className="h-9 px-2 text-slate-400 hover:text-slate-600" aria-label="Cancel new sub-category">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-sub-icon" className="text-[10px]">Icon</Label>
                <EmojiPicker id="new-sub-icon" value={newSubIcon} onChange={setNewSubIcon} size="sm" />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(selectedCategory.subCategories || []).map((sub) => (
                <button
                  key={sub._id}
                  type="button"
                  onClick={() => setValue("subCategoryId", watchSubCategoryId === sub._id ? null : sub._id)}
                  aria-pressed={watchSubCategoryId === sub._id}
                  className={`flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    watchSubCategoryId === sub._id
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {sub.icon && <span className="mr-1.5">{sub.icon}</span>}
                  {sub.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCreatingSub(true)}
                className="flex items-center rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <span className="mr-1">➕</span> Add Yours
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="description" className="text-slate-700">Description (optional)</Label>
          <Input
            id="description"
            className="h-11 rounded-xl bg-slate-50/50 border-slate-200"
            placeholder="Lunch, Groceries, etc."
            maxLength={200}
            {...register("description")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date" className="text-slate-700">Date</Label>
          <Input
            id="date"
            type="date"
            className="h-11 rounded-xl bg-slate-50/50 border-slate-200"
            {...register("date", { required: "Date is required" })}
          />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-md shadow-blue-500/20" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : editingExpense ? "Update Expense" : "Save Expense"}
        </Button>
        {editingExpense && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => requestDelete("expense", editingExpense)}
            className="mt-2 w-full h-11 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete expense
          </Button>
        )}
      </div>
      {deleteDialog}
    </form>
  )
}
