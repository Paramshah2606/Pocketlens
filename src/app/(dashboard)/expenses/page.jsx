"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Calendar, Receipt, Edit2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useSelector, useDispatch } from "react-redux"
import { openAddExpenseModal } from "@/store/uiSlice"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const dispatch = useDispatch()
  const refreshTrigger = useSelector((state) => state.ui.refreshTrigger)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/expenses")
      const data = await res.json()
      setExpenses(data.expenses || [])
    } catch (error) {
      console.error("Failed to fetch data", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return
    
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (res.ok) {
        dispatch(triggerRefresh())
      } else {
        alert("Failed to delete expense")
      }
    } catch (error) {
      console.error("Delete error", error)
    }
  }

  const handleEdit = (expense) => {
    dispatch(openAddExpenseModal(expense))
  }

  return (
    <div className="space-y-8 relative max-w-4xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h1>
          <p className="text-slate-500 mt-1">Track and manage your daily spending.</p>
        </div>
        <Button onClick={() => dispatch(openAddExpenseModal())} className="hidden md:flex rounded-full h-12 px-6 shadow-md shadow-blue-500/20">
          <Plus className="mr-2 h-5 w-5" /> Add Expense
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm mb-6 text-slate-400">
                <Receipt className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No expenses yet</h3>
              <p className="text-slate-500 mb-8 max-w-sm mt-2 leading-relaxed">
                Start tracking your spending by adding your first expense. It takes just seconds!
              </p>
              <Button onClick={() => dispatch(openAddExpenseModal())} className="rounded-full h-12 px-8 shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Add First Expense
              </Button>
            </div>
          ) : (
            expenses.map((expense) => (
              <Card key={expense._id} className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div 
                      className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
                      style={{ backgroundColor: `${expense.categoryId.color}15`, color: expense.categoryId.color }}
                    >
                      <span className="text-2xl">{expense.categoryId.icon || "🏷️"}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{expense.categoryId.name}</h3>
                      <p className="text-sm text-slate-500">{expense.description || "No description"}</p>
                      <div className="flex items-center text-xs font-medium text-slate-400 mt-1.5">
                        <Calendar className="mr-1.5 h-3.5 w-3.5" />
                        {formatDate(expense.date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xl font-bold text-slate-900">{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        onClick={() => handleEdit(expense)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={() => handleDelete(expense._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
