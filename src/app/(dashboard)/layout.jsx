"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  PieChart,
  Wallet,
  Target,
  Settings,
  LogOut,
  Plus,
  Tags,
  CalendarDays,
  Banknote
} from "lucide-react"

import { Button } from "@/components/ui/button"
import AddExpenseModal from "@/components/expenses/AddExpenseModal"
import { useDispatch } from "react-redux"
import { openAddExpenseModal, openAddIncomeModal } from "@/store/uiSlice"
import { Logo } from "@/components/ui/Logo"
import { InstallAppButton } from "@/components/InstallApp"
import { Toaster } from "@/components/Toaster"
import { AppEffects, OfflineBanner } from "@/components/AppEffects"
import { toast } from "@/lib/toast"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: PieChart },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  { name: "Budgets", href: "/budgets", icon: Target },
  { name: "Calendar", href: "/calendar", icon: CalendarDays, desktopOnly: true },
  { name: "Categories", href: "/categories", icon: Tags, desktopOnly: true },
  { name: "Settings", href: "/settings", icon: Settings },
]

// The mobile bottom bar has room for four items around the add button. On phones,
// Calendar is in the top header and Categories is reached via Settings / the add sheet.
const mobileNavItems = navItems.filter((item) => !item.desktopOnly)

function BottomNavLink({ item, isActive }) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-w-16 flex-col items-center justify-center gap-1 px-2 py-2 ${isActive ? "text-primary" : "text-slate-500"}`}
    >
      <item.icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{item.name}</span>
    </Link>
  )
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useDispatch()
  const current = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout failed", error)
      toast.error("Couldn't log out. Check your connection and try again.")
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 md:flex-row">
      <Suspense fallback={null}>
        <AppEffects />
      </Suspense>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-white md:flex h-dvh sticky top-0">
        <div className="flex h-16 items-center border-b px-6">
          <Logo size="md" asLink={false} />
        </div>

        <div className="px-4 pt-4">
          <Button onClick={() => dispatch(openAddExpenseModal())} className="h-11 w-full rounded-xl shadow-sm shadow-blue-500/20">
            <Plus className="mr-2 h-4 w-4" /> Add expense
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto custom-scrollbar" aria-label="Main">
          {navItems.map((item) => {
            const isActive = item === current
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
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
          <p className="mb-3 hidden px-3 text-xs text-slate-400 lg:block">
            Tip: press <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 font-sans font-semibold text-slate-500">N</kbd> to add an expense
          </p>
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
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
            <div className="flex min-w-0 items-center md:hidden">
              <Logo size="md" asLink={false} />
            </div>

            <p className="hidden truncate text-lg font-semibold text-slate-900 md:block">{current?.name || ""}</p>

            <div className="flex items-center gap-2 sm:gap-3">
              <InstallAppButton
                size="sm"
                variant="secondary"
                className="rounded-full px-3 text-xs sm:text-sm bg-blue-50 text-blue-700 hover:bg-blue-100"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch(openAddIncomeModal())}
                className="hidden rounded-full px-3 text-emerald-700 hover:bg-emerald-50 md:inline-flex"
              >
                <Banknote className="mr-1.5 h-4 w-4" /> Add income
              </Button>
              <Link
                href="/calendar"
                className={`rounded-full p-2 md:hidden ${pathname === "/calendar" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"}`}
                aria-label="Calendar"
                aria-current={pathname === "/calendar" ? "page" : undefined}
              >
                <CalendarDays className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <OfflineBanner />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (padded for the iPhone home indicator) */}
      <nav
        aria-label="Main"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-white pt-1 pb-[env(safe-area-inset-bottom)] md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
      >
        <div className="flex h-16 w-full items-center justify-around">
          {mobileNavItems.slice(0, 2).map((item) => (
            <BottomNavLink key={item.name} item={item} isActive={item === current} />
          ))}

          {/* Floating Action Button (FAB) for adding expense */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              onClick={() => dispatch(openAddExpenseModal())}
              aria-label="Add expense or income"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {mobileNavItems.slice(2).map((item) => (
            <BottomNavLink key={item.name} item={item} isActive={item === current} />
          ))}
        </div>
      </nav>

      <AddExpenseModal />
      <Toaster />
    </div>
  )
}
