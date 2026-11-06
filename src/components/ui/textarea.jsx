import * as React from "react"
import { cn } from "@/lib/utils"

// 16px on phones stops iOS from zooming into focused fields; 14px from `sm` up.
// Only applied when the caller doesn't set its own font size (e.g. the big amount field),
// because tailwind-merge can't tell that `sm:text-sm` should yield to a plain `text-2xl`.
const hasOwnTextSize = (className = "") => /(^|\s)text-(xs|sm|base|lg|xl|[2-9]xl)(\s|$)/.test(className)
const DEFAULT_TEXT_SIZE = "text-base sm:text-sm"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        hasOwnTextSize(className) ? null : DEFAULT_TEXT_SIZE,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
