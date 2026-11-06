"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { WifiOff } from "lucide-react"

import { openAddExpenseModal, openAddIncomeModal } from "@/store/uiSlice"

// Session expiry: when any app API call answers 401, send the user to the login page
// instead of leaving the screen half-broken.
function useSessionWatcher() {
  const router = useRouter()
  useEffect(() => {
    if (window.__pocketlensFetchPatched) return
    window.__pocketlensFetchPatched = true
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || ""
      if (response.status === 401 && url.startsWith("/api/") && !url.startsWith("/api/auth/")) {
        router.replace("/login?expired=1")
      }
      return response
    }
  }, [router])
}

function subscribeOnline(callback) {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)
  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
  if (online) return null
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 border-b border-amber-100">
      <WifiOff className="h-3.5 w-3.5" /> You&apos;re offline. Changes can&apos;t be saved until you reconnect.
    </div>
  )
}

// ?add=expense | ?add=income opens the add sheet (used by the home-screen app shortcuts),
// and "N" opens it from the keyboard on desktop.
function useAddShortcuts() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isOpen = useSelector((state) => state.ui.isAddExpenseModalOpen)

  useEffect(() => {
    const add = searchParams.get("add")
    if (add !== "expense" && add !== "income") return
    dispatch(add === "income" ? openAddIncomeModal() : openAddExpenseModal())
    router.replace(pathname)
  }, [searchParams, dispatch, router, pathname])

  useEffect(() => {
    const onKey = (e) => {
      if (isOpen || e.metaKey || e.ctrlKey || e.altKey) return
      const tag = e.target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) return
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
      if (e.key === "n" || e.key === "N") {
        e.preventDefault()
        dispatch(openAddExpenseModal())
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dispatch, isOpen])
}

export function AppEffects() {
  useSessionWatcher()
  useAddShortcuts()
  return null
}
