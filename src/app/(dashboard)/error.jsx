"use client" // Error boundaries must be Client Components

import { useEffect } from "react"
import { AlertTriangle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// Shown inside the app shell (sidebar and tab bar stay usable) when a page crashes
export default function DashboardError({ error, retry }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-slate-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500">
        This page couldn&apos;t load. Check your connection and try again.
      </p>
      <Button onClick={() => retry()} className="mt-6 h-11 rounded-full px-6">
        <RotateCw className="mr-2 h-4 w-4" /> Try again
      </Button>
    </div>
  )
}
