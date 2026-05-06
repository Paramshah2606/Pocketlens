"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Calendar, Receipt, Edit2, Trash2, Filter, ArrowUpDown, Search, ChevronDown, Tag, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useSelector, useDispatch } from "react-redux"
import { openAddExpenseModal, triggerRefresh } from "@/store/uiSlice"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 10
  })
  
  const [filters, setFilters] = useState({
    dateType: 'all',
    startDate: '',
    endDate: '',
    categoryId: 'all',
    subCategoryId: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1
  })
  
  const dispatch = useDispatch()
  const refreshTrigger = useSelector((state) => state.ui.refreshTrigger)

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Failed to fetch categories", error)
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          queryParams.append(key, value)
        }
      })
      const res = await fetch(`/api/expenses?${queryParams.toString()}`)
      const data = await res.json()
      setExpenses(data.expenses || [])
      setPagination(data.pagination || { total: 0, page: 1, totalPages: 1, limit: 10 })
    } catch (error) {
      console.error("Failed to fetch data", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchData()
  }, [refreshTrigger, filters])

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

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      if (key !== 'page') {
        newFilters.page = 1
      }
      if (key === 'categoryId') {
        newFilters.subCategoryId = 'all'
      }
      return newFilters
    })
  }

  const selectedCategory = categories.find(c => c._id === filters.categoryId)

  return (
    <div className="space-y-6 relative max-w-5xl mx-auto pb-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h1>
          <p className="text-slate-500 mt-1">Track and manage your daily spending.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={`rounded-full h-11 px-5 border-slate-200 transition-all ${isFilterVisible ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
          >
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
          <Button onClick={() => dispatch(openAddExpenseModal())} className="rounded-full h-11 px-6 shadow-md shadow-blue-500/20">
            <Plus className="mr-2 h-5 w-5" /> Add Expense
          </Button>
        </div>
      </div>

      {isFilterVisible && (
        <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white animate-in fade-in slide-in-from-top-4 duration-300">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" /> Date Range
                </Label>
                <div className="relative group">
                  <select 
                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer hover:border-slate-300 transition-all"
                    value={filters.dateType}
                    onChange={(e) => handleFilterChange('dateType', e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="thisWeek">This Week</option>
                    <option value="thisMonth">This Month</option>
                    <option value="thisYear">This Year</option>
                    <option value="single">Single Date</option>
                    <option value="range">Date Range</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-slate-600" />
                </div>
              </div>

              {(filters.dateType === 'single' || filters.dateType === 'range') && (
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold text-xs uppercase tracking-wider">Start Date</Label>
                  <Input 
                    type="date" 
                    className="rounded-2xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                    max={new Date().toISOString().split('T')[0]}
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
              )}

              {filters.dateType === 'range' && (
                <div className="space-y-2">
                  <Label className="text-slate-600 font-semibold text-xs uppercase tracking-wider">End Date</Label>
                  <Input 
                    type="date" 
                    className="rounded-2xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                    max={new Date().toISOString().split('T')[0]}
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
                  <Tag className="h-3.5 w-3.5 text-blue-500" /> Category
                </Label>
                <div className="relative group">
                  <select 
                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer hover:border-slate-300 transition-all"
                    value={filters.categoryId}
                    onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-slate-600" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
                  <Layers className="h-3.5 w-3.5 text-blue-500" /> Sub Category
                </Label>
                <div className="relative group">
                  <select 
                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    value={filters.subCategoryId}
                    onChange={(e) => handleFilterChange('subCategoryId', e.target.value)}
                    disabled={filters.categoryId === 'all'}
                  >
                    <option value="all">All Sub Categories</option>
                    {selectedCategory?.subCategories?.map(sub => (
                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-slate-600" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
                  <ArrowUpDown className="h-3.5 w-3.5 text-blue-500" /> Sort By
                </Label>
                <div className="relative group">
                  <select 
                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer hover:border-slate-300 transition-all"
                    value={`${filters.sortBy}_${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('_')
                      handleFilterChange('sortBy', sortBy)
                      handleFilterChange('sortOrder', sortOrder)
                    }}
                  >
                    <option value="date_desc">Date: Newest first</option>
                    <option value="date_asc">Date: Oldest first</option>
                    <option value="amount_desc">Amount: High to Low</option>
                    <option value="amount_asc">Amount: Low to High</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-slate-600" />
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full font-medium"
                onClick={() => setFilters({
                  dateType: 'all',
                  startDate: '',
                  endDate: '',
                  categoryId: 'all',
                  subCategoryId: 'all',
                  sortBy: 'date',
                  sortOrder: 'desc',
                  page: 1
                })}
              >
                Clear all filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              <h3 className="text-xl font-bold text-slate-900">No expenses found</h3>
              <p className="text-slate-500 mb-8 max-w-sm mt-2 leading-relaxed">
                Adjust your filters or start tracking your spending by adding a new expense.
              </p>
              <Button onClick={() => dispatch(openAddExpenseModal())} className="rounded-full h-12 px-8 shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Add New Expense
              </Button>
            </div>
          ) : (
            <>
              {expenses.map((expense) => {
                const subCategory = expense.categoryId.subCategories?.find(sc => sc._id === expense.subCategoryId)
                
                return (
                  <Card key={expense._id} className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                    <CardContent className="p-5 sm:p-6 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div 
                          className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
                          style={{ backgroundColor: `${expense.categoryId.color}15`, color: expense.categoryId.color }}
                        >
                          <span className="text-2xl">{expense.categoryId.icon || "🏷️"}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-lg">{expense.categoryId.name}</h3>
                            {subCategory && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                {subCategory.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">{expense.description || "No description"}</p>
                          <div className="flex items-center text-xs font-medium text-slate-400 mt-1.5">
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            {formatDate(expense.date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-xl font-bold text-slate-900">{formatCurrency(expense.amount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            onClick={() => handleEdit(expense)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            onClick={() => handleDelete(expense._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mt-8">
                  <p className="text-sm text-slate-500 font-medium">
                    Showing <span className="text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-slate-900">{pagination.total}</span> expenses
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 border-slate-200 disabled:opacity-50"
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                      disabled={filters.page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {[...Array(pagination.totalPages)].map((_, i) => {
                        const p = i + 1;
                        // Only show current page and its neighbors, and first/last
                        if (
                          p === 1 || 
                          p === pagination.totalPages || 
                          (p >= filters.page - 1 && p <= filters.page + 1)
                        ) {
                          return (
                            <Button
                              key={p}
                              variant={filters.page === p ? "default" : "ghost"}
                              size="sm"
                              className={`rounded-xl h-9 w-9 p-0 ${filters.page === p ? "shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
                              onClick={() => handleFilterChange('page', p)}
                            >
                              {p}
                            </Button>
                          );
                        } else if (
                          p === filters.page - 2 || 
                          p === filters.page + 2
                        ) {
                          return <span key={p} className="text-slate-300">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-9 border-slate-200 disabled:opacity-50"
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                      disabled={filters.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

