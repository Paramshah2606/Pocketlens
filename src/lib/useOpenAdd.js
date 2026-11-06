"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"
import { openAddExpenseModal, openAddIncomeModal, openAddModalForDate } from "@/store/uiSlice"

// Layout split used across the app shell: below this width (phones and tablets) the app
// uses the bottom tab bar and the full-screen Add screen; at or above it (laptops and
// desktops) the sidebar and the quick-add pop-up. Matches Tailwind's `lg` breakpoint.
export const DESKTOP_QUERY = "(min-width: 1024px)"

export const isDesktop = () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches

// Where "home" is for this device: the Add screen on phones/tablets, the dashboard on desktop
export const homePath = () => (isDesktop() ? "/dashboard" : "/add")

// Opens "add an expense / income" the right way for the device.
//   openAdd()                       → new expense
//   openAdd("income")               → new income
//   openAdd("expense", "2026-11-03") → new expense on a given day
export function useOpenAdd() {
  const router = useRouter()
  const dispatch = useDispatch()

  return useCallback((type = "expense", date = null) => {
    if (isDesktop()) {
      if (date) dispatch(openAddModalForDate({ type, date }))
      else dispatch(type === "income" ? openAddIncomeModal() : openAddExpenseModal())
      return
    }
    const params = new URLSearchParams({ type })
    if (date) params.set("date", date)
    router.push(`/add?${params}`)
  }, [dispatch, router])
}
