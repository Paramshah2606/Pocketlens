"use client"

import { useEffect, useState } from "react"
import { RefreshCw, X } from "lucide-react"

// Installed apps (and long-open tabs) keep running the code they started with. This
// checks whether a newer version has been deployed and offers a one-tap refresh:
// when the app comes back to the foreground, when the device reconnects, and every
// 30 minutes while it stays open.
const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION
const CHECK_EVERY_MS = 30 * 60 * 1000
const MIN_GAP_MS = 60 * 1000 // don't re-check more than once a minute

export function UpdateNotifier() {
  const [available, setAvailable] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!CURRENT_VERSION || process.env.NODE_ENV !== "production") return
    let lastCheck = 0
    let stopped = false

    const check = async () => {
      if (stopped || Date.now() - lastCheck < MIN_GAP_MS || !navigator.onLine) return
      lastCheck = Date.now()
      try {
        const res = await fetch("/api/version", { cache: "no-store" })
        if (!res.ok) return
        const { version } = await res.json()
        if (version && version !== CURRENT_VERSION) {
          setAvailable(true)
          setDismissed(false)
          // Also fetch the new service worker so the next launch is fully up to date
          navigator.serviceWorker?.getRegistration().then((reg) => reg?.update()).catch(() => {})
        }
      } catch {
        // Offline or a transient error: try again on the next trigger
      }
    }

    const onVisible = () => document.visibilityState === "visible" && check()
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", check)
    const timer = setInterval(check, CHECK_EVERY_MS)
    const first = setTimeout(check, 5000)

    return () => {
      stopped = true
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", check)
      clearInterval(timer)
      clearTimeout(first)
    }
  }, [])

  if (!available || dismissed) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[130] flex justify-center px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pointer-events-none"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl animate-in fade-in slide-in-from-top-2">
        <RefreshCw className="h-4 w-4 shrink-0 text-blue-300" />
        <span className="flex-1">A new version of PocketLens is available.</span>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100"
        >
          Update
        </button>
        <button onClick={() => setDismissed(true)} className="rounded-full p-1 text-slate-400 hover:text-white" aria-label="Later">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
