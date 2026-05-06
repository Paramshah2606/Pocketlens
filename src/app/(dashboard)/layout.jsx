"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  PieChart, 
  Wallet, 
  Target, 
  Settings, 
  LogOut, 
  Bell,
  Menu,
  Plus
} from "lucide-react"

import { Button } from "@/components/ui/button"
import AddExpenseModal from "@/components/expenses/AddExpenseModal"
import { useDispatch } from "react-redux"
import { openAddExpenseModal } from "@/store/uiSlice"
import { Logo } from "@/components/ui/Logo"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: PieChart },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  { name: "Budgets", href: "/budgets", icon: Target },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-white md:flex h-screen sticky top-0">
        <div className="flex h-16 items-center border-b px-6">
          <Logo size="md" asLink={false} />
        </div>
        
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5 text-slate-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pb-16 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:px-6">
          <div className="flex items-center md:hidden">
            <Logo size="md" asLink={false} />
          </div>
          
          <div className="hidden md:block">
            {/* Can put page title here dynamically based on pathname */}
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-white pb-safe pt-1 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 ${
                isActive ? "text-primary" : "text-slate-500"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}

        {/* Floating Action Button (FAB) for adding expense */}
        <div className="relative -top-5 flex flex-col items-center">
          <button 
            onClick={() => dispatch(openAddExpenseModal())}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 ${
                isActive ? "text-primary" : "text-slate-500"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
      
      <AddExpenseModal />
    </div>
  )
}
