"use client"

import { CircleCheck, CircleAlert, Info, X } from "lucide-react"
import { toast, useToasts } from "@/lib/toast"

const STYLES = {
  success: { icon: CircleCheck, className: "text-emerald-600" },
  error: { icon: CircleAlert, className: "text-red-600" },
  info: { icon: Info, className: "text-blue-600" },
}

// Bottom-centre on phones (above the tab bar), bottom-right on desktop
export function Toaster() {
  const toasts = useToasts()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[120] flex flex-col items-center gap-2 px-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:items-end"
    >
      {toasts.map((t) => {
        const { icon: Icon, className } = STYLES[t.type] || STYLES.info
        return (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-lg shadow-slate-900/10 animate-in fade-in slide-in-from-bottom-2"
          >
            <Icon className={`h-5 w-5 shrink-0 ${className}`} />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => toast.dismiss(t.id)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
