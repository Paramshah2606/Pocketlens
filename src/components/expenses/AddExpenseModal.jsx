"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { X, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDispatch, useSelector } from "react-redux"
import { closeAddExpenseModal, triggerRefresh } from "@/store/uiSlice"

export default function AddExpenseModal() {
  const dispatch = useDispatch()
  const isAddExpenseModalOpen = useSelector((state) => state.ui.isAddExpenseModalOpen)
  const editingExpense = useSelector((state) => state.ui.editingExpense)
  
  const [categories, setCategories] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatIcon, setNewCatIcon] = useState("🏷️")
  const [isSubmittingCat, setIsSubmittingCat] = useState(false)
  
  const [isCreatingSub, setIsCreatingSub] = useState(false)
  const [newSubName, setNewSubName] = useState("")
  const [newSubIcon, setNewSubIcon] = useState("✨")
  const [isSubmittingSub, setIsSubmittingSub] = useState(false)
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  })
  
  const watchCategoryId = watch("categoryId")
  const watchSubCategoryId = watch("subCategoryId")

  useEffect(() => {
    if (isAddExpenseModalOpen) {
      fetchCategories()
      
      if (editingExpense) {
        setValue("amount", editingExpense.amount)
        setValue("categoryId", editingExpense.categoryId._id || editingExpense.categoryId)
        setValue("subCategoryId", editingExpense.subCategoryId?._id || editingExpense.subCategoryId || null)
        setValue("description", editingExpense.description || "")
        setValue("date", new Date(editingExpense.date).toISOString().split('T')[0])
      } else {
        reset({
          amount: "",
          categoryId: "",
          subCategoryId: null,
          description: "",
          date: new Date().toISOString().split('T')[0]
        })
        setSelectedCategory(null)
      }
    }
  }, [isAddExpenseModalOpen, editingExpense, setValue, reset])

  useEffect(() => {
    if (categories.length > 0 && watchCategoryId) {
      const cat = categories.find(c => c._id === watchCategoryId)
      if (cat) setSelectedCategory(cat)
    }
  }, [categories, watchCategoryId])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories", error)
    }
  }

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat)
    setValue("categoryId", cat._id)
    setValue("subCategoryId", null) // reset subcategory when category changes
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense._id}` : "/api/expenses"
      const method = editingExpense ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      if (!res.ok) throw new Error(`Failed to ${editingExpense ? 'update' : 'add'} expense`)
      
      dispatch(triggerRefresh())
      dispatch(closeAddExpenseModal())
      reset()
      setSelectedCategory(null)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    setIsSubmittingCat(true)
    
    const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#f43f5e"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, icon: newCatIcon, color: randomColor })
      })
      if(res.ok) {
        const data = await res.json()
        await fetchCategories()
        handleCategorySelect(data.category)
        setIsCreatingCategory(false)
        setNewCatName("")
        setNewCatIcon("🏷️")
      }
    } catch (error) {
      console.error("Failed to create category", error)
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
        body: JSON.stringify({
          name: newSubName,
          icon: newSubIcon,
          parentCategoryId: selectedCategory._id
        })
      })
      if (res.ok) {
        const data = await res.json()
        await fetchCategories()
        // categoryId stays the same — no cloning; selectedCategory re-syncs via useEffect
        setValue("subCategoryId", data.category._id)
        setIsCreatingSub(false)
        setNewSubName("")
        setNewSubIcon("✨")
      }
    } catch (error) {
      console.error("Failed to create subcategory", error)
    } finally {
      setIsSubmittingSub(false)
    }
  }

  if (!isAddExpenseModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/40 backdrop-blur-sm transition-all md:items-center md:justify-center">
      <div className="w-full animate-in slide-in-from-bottom-full rounded-t-3xl bg-white p-6 shadow-2xl md:max-w-lg md:rounded-3xl border border-slate-100">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isCreatingCategory ? "New Category" : (editingExpense ? "Edit Expense" : "Add Expense")}
            </h2>
            <p className="text-sm text-slate-500">
              {isCreatingCategory ? "Create your custom category" : (editingExpense ? "Update your transaction details" : "Track a new transaction")}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 hover:bg-slate-200" onClick={() => {
            if (isCreatingCategory) {
              setIsCreatingCategory(false)
            } else {
              dispatch(closeAddExpenseModal())
            }
          }}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {isCreatingCategory ? (
          <form onSubmit={handleCreateCategory} className="space-y-5 animate-in fade-in zoom-in-95">
            <div className="space-y-2">
               <Label className="text-slate-700">Category Name</Label>
               <Input 
                 value={newCatName} 
                 onChange={e => setNewCatName(e.target.value)} 
                 className="bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20"
                 required 
                 placeholder="e.g. Subscriptions, Gifts" 
               />
            </div>
            <div className="space-y-2">
               <Label className="text-slate-700">Icon (Emoji)</Label>
               <Input 
                 value={newCatIcon} 
                 onChange={e => setNewCatIcon(e.target.value)} 
                 className="bg-slate-50/50 border-slate-200 text-2xl h-14 w-16 text-center focus-visible:ring-primary/20"
                 required 
               />
               <p className="text-xs text-slate-500">Pick an emoji to represent this category.</p>
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-md shadow-blue-500/20" disabled={isSubmittingCat}>
                {isSubmittingCat ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Category"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in fade-in zoom-in-95">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-slate-700">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500 font-semibold text-lg">₹</span>
              <Input 
                id="amount" 
                type="number" 
                step="0.01" 
                className="pl-9 h-14 text-2xl font-bold rounded-2xl bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 transition-all" 
                placeholder="0.00" 
                autoFocus
                {...register("amount", { required: "Amount is required" })}
              />
            </div>
            {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Category</Label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition-all ${
                    watchCategoryId === cat._id 
                      ? 'border-transparent bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10 ring-2 ring-blue-500/20' 
                      : 'border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200'
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

          {selectedCategory && selectedCategory.subCategories && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label className="text-slate-700">Sub-category</Label>
              
              {isCreatingSub ? (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                  <div className="flex items-end gap-2">
                    <div className="space-y-1 w-16">
                      <Label className="text-[10px]">Icon</Label>
                      <Input value={newSubIcon} onChange={e=>setNewSubIcon(e.target.value)} className="h-9 text-center bg-white" required />
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label className="text-[10px]">Name</Label>
                      <Input value={newSubName} onChange={e=>setNewSubName(e.target.value)} className="h-9 bg-white" placeholder="e.g. Uber" required />
                    </div>
                    <Button onClick={handleCreateSubCategory} type="button" disabled={isSubmittingSub} size="sm" className="h-9 rounded-lg px-4">
                      {isSubmittingSub ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button onClick={() => setIsCreatingSub(false)} type="button" variant="ghost" size="sm" className="h-9 px-2 text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.subCategories.map(sub => (
                    <button
                      key={sub._id}
                      type="button"
                      onClick={() => setValue("subCategoryId", sub._id)}
                      className={`flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        watchSubCategoryId === sub._id 
                          ? 'border-primary bg-primary text-white' 
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700">Description (Optional)</Label>
            <Input 
              id="description" 
              className="h-11 rounded-xl bg-slate-50/50 border-slate-200"
              placeholder="Lunch, Groceries, etc." 
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

          <div className="pt-2">
            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-md shadow-blue-500/20" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (editingExpense ? "Update Transaction" : "Save Transaction")}
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
