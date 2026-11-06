"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Loader2, Calendar, Receipt, Edit2, Trash2, Filter, ArrowUpDown, Search, ChevronDown, Tag, Layers, Download, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useSelector, useDispatch } from "react-redux"
import { openAddExpenseModal } from "@/store/uiSlice"
import { useDeleteEntry } from "@/components/DeleteEntryDialog"
import { useOpenAdd } from "@/lib/useOpenAdd"
import { localDateKey } from "@/lib/dates"

const DATE_TYPES = ['all', 'today', 'thisWeek', 'thisMonth', 'thisYear', 'single', 'range']
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const ID_RE = /^[a-f0-9]{24}$/i

// Filters a link can preset, e.g. from the dashboard cards or a chart:
// /expenses?dateType=range&startDate=2026-11-01&endDate=2026-11-30&categoryId=…&subCategoryId=…
function filtersFromUrl(params) {
  const preset = {}
  const dateType = params.get('dateType')
  if (DATE_TYPES.includes(dateType)) preset.dateType = dateType
  for (const key of ['startDate', 'endDate']) {
    if (DAY_RE.test(params.get(key) || '')) preset[key] = params.get(key)
  }
  if (ID_RE.test(params.get('categoryId') || '')) {
    preset.categoryId = params.get('categoryId')
    if (ID_RE.test(params.get('subCategoryId') || '')) preset.subCategoryId = params.get('subCategoryId')
  }
  return preset
}

const DATE_LABELS = { today: 'Today', thisWeek: 'This week', thisMonth: 'This month', thisYear: 'This year' }
const dayFmt = (key, withYear) => new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC',
}).format(new Date(`${key}T00:00:00Z`))

// "1 Nov – 30 Nov 2026", "5 Nov 2026", "This month"… or null for "all time"
function describeDateFilter({ dateType, startDate, endDate }) {
  if (DATE_LABELS[dateType]) return DATE_LABELS[dateType]
  if (dateType === 'single' && startDate) return dayFmt(startDate, true)
  if (dateType === 'range' && startDate && endDate) {
    const [from, to] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate]
    if (from === to) return dayFmt(from, true)
    return `${dayFmt(from, from.slice(0, 4) !== to.slice(0, 4))} – ${dayFmt(to, true)}`
  }
  return null
}

// useSearchParams needs a Suspense boundary so the page can still be prerendered
export default function ExpensesPage() {
  return (
    <Suspense fallback={null}>
      <ExpensesFromUrl />
    </Suspense>
  )
}

// Remount when the link's filters change (e.g. tapping "Expenses" while a filtered list is open)
function ExpensesFromUrl() {
  const searchParams = useSearchParams()
  return <ExpensesView key={searchParams.toString()} searchParams={searchParams} />
}

function ExpensesView({ searchParams }) {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  // Arriving from a link with filters: apply them (shown as chips, panel stays closed)
  const [urlFilters] = useState(() => filtersFromUrl(searchParams))
  const [isFilterVisible, setIsFilterVisible] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)
  
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
    page: 1,
    ...urlFilters
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

  // Current filters as query params; "today" lets the server use the user's own calendar
  const buildQuery = (extra = {}) => {
    const queryParams = new URLSearchParams({ today: localDateKey() })
    Object.entries({ ...filters, ...extra }).forEach(([key, value]) => {
      if (value && value !== 'all') {
        queryParams.set(key, value)
      }
    })
    return queryParams.toString()
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/expenses?${buildQuery()}`)
      const data = await res.json()
      setExpenses(data.expenses || [])
      setTotalAmount(data.totalAmount || 0)
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

  const { requestDelete, deleteDialog } = useDeleteEntry()
  const openAdd = useOpenAdd()

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
  const selectedSub = selectedCategory?.subCategories?.find(sub => sub._id === filters.subCategoryId)

  // Applied filters, shown as removable chips so the list's scope is clear without the panel
  const appliedFilters = []
  const dateChip = describeDateFilter(filters)
  if (dateChip) {
    appliedFilters.push({ key: 'date', icon: Calendar, label: dateChip, clear: () => setFilters(prev => ({ ...prev, dateType: 'all', startDate: '', endDate: '', page: 1 })) })
  }
  if (filters.categoryId !== 'all') {
    appliedFilters.push({
      key: 'category',
      emoji: selectedCategory?.icon,
      label: selectedCategory?.name || 'Category',
      clear: () => handleFilterChange('categoryId', 'all'),
    })
  }
  if (filters.subCategoryId !== 'all') {
    appliedFilters.push({
      key: 'sub',
      emoji: selectedSub?.icon,
      label: selectedSub?.name || 'Sub-category',
      clear: () => handleFilterChange('subCategoryId', 'all'),
    })
  }
  const clearAllFilters = () => setFilters({
    dateType: 'all',
    startDate: '',
    endDate: '',
    categoryId: 'all',
    subCategoryId: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1
  })

  return (
    <div className="space-y-6 relative max-w-5xl mx-auto pb-10 px-3 sm:px-4">
      <div className="flex items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">Expenses</h1>
          <p className="hidden sm:block text-slate-500 mt-1">Track and manage your daily spending.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href={`/api/expenses?${buildQuery({ format: 'csv', page: '' })}`}
            download
            aria-label="Export expenses as CSV"
            title="Export the expenses matching your filters as a CSV file"
            className={`inline-flex items-center justify-center rounded-full h-9 sm:h-11 px-3 sm:px-5 border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all ${pagination.total ? '' : 'pointer-events-none opacity-50'}`}
          >
            <Download className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Export</span>
          </a>
          <Button 
            variant="outline" 
            size="sm"
            aria-label="Filters"
            aria-expanded={isFilterVisible}
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={`rounded-full h-9 sm:h-11 px-3 sm:px-5 border-slate-200 transition-all ${isFilterVisible ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
          >
            <Filter className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Filters</span>
            {appliedFilters.length > 0 && (
              <span className="ml-1 sm:ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white">
                {appliedFilters.length}
              </span>
            )}
          </Button>
          <Button size="sm" onClick={() => openAdd()} className="rounded-full h-9 sm:h-11 px-3 sm:px-6 shadow-md shadow-blue-500/20">
            <Plus className="mr-0 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {appliedFilters.length > 0 && !isFilterVisible && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1" aria-label="Applied filters">
          {appliedFilters.map(({ key, icon: Icon, emoji, label, clear }) => (
            <span key={key} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 py-1.5 pl-3 pr-1.5 text-sm font-semibold text-blue-700">
              {Icon ? <Icon className="h-3.5 w-3.5" /> : emoji ? <span className="leading-none">{emoji}</span> : null}
              <span className="max-w-[12rem] truncate">{label}</span>
              <button
                type="button"
                onClick={clear}
                aria-label={`Remove ${label} filter`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-blue-500 hover:bg-blue-100 hover:text-blue-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            Clear all
          </button>
        </div>
      )}

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
                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer hover:border-slate-300 transition-all"
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
                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer hover:border-slate-300 transition-all"
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
                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer hover:border-slate-300 transition-all"
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
                onClick={clearAllFilters}
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
          {pagination.total > 0 && (
            <div className="flex items-center justify-between gap-3 px-1 text-sm">
              <span className="text-slate-500">
                {pagination.total} expense{pagination.total === 1 ? "" : "s"}
              </span>
              <span className="font-semibold text-slate-900">
                Total <span className="text-red-500">{formatCurrency(totalAmount)}</span>
              </span>
            </div>
          )}
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 sm:p-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm mb-6 text-slate-400">
                <Receipt className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No expenses found</h3>
              <p className="text-slate-500 mb-8 max-w-sm mt-2 leading-relaxed">
                Adjust your filters or start tracking your spending by adding a new expense.
              </p>
              <Button onClick={() => openAdd()} className="rounded-full h-12 px-8 shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Add New Expense
              </Button>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {expenses.map((expense) => {
                  const category = expense.categoryId
                  const subCategory = expense.subCategoryId
                  const color = category?.color || "#64748b"
                  const actions = (
                    <div className="-mr-1.5 flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => handleEdit(expense)}
                        aria-label="Edit expense"
                        className="-my-1 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete("expense", expense)}
                        aria-label="Delete expense"
                        className="-my-1 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )

                  return (
                    <li
                      key={expense._id}
                      className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div
                        className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl text-lg sm:text-xl"
                        style={{ backgroundColor: `${color}1a` }}
                      >
                        {category?.icon || "🏷️"}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Line 1: what + how much */}
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-[15px] font-semibold text-slate-900">{category?.name || "Uncategorized"}</h3>
                          {subCategory && (
                            <span className="max-w-[40%] shrink-0 truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              {subCategory.name}
                            </span>
                          )}
                          <span className="ml-auto shrink-0 pl-2 text-[15px] sm:text-base font-bold tabular-nums text-slate-900">
                            {formatCurrency(expense.amount)}
                          </span>
                        </div>

                        {/* Line 2: when. The actions sit on the card's last line: here, or beside the note */}
                        {expense.description ? (
                          <>
                            <p className="mt-0.5 truncate text-xs text-slate-400">{formatDate(expense.date)}</p>
                            {/* The note in full: it wraps instead of being cut off */}
                            <div className="mt-1 flex items-end gap-2">
                              <p className="min-w-0 flex-1 whitespace-pre-line break-words text-[13px] leading-snug text-slate-600">
                                {expense.description}
                              </p>
                              {actions}
                            </div>
                          </>
                        ) : (
                          <div className="mt-0.5 flex items-center gap-2">
                            <p className="min-w-0 flex-1 truncate text-xs text-slate-400">{formatDate(expense.date)}</p>
                            {actions}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mt-8">
                  <p className="text-sm text-slate-500 font-medium text-center sm:text-left">
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
      {deleteDialog}
    </div>
  )
}
