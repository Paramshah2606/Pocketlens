"use client"

import { useEffect } from "react"

// Registers the PWA service worker. Skipped in development so cached
// build assets don't interfere with hot reloading.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("Service worker registration failed:", err))
  }, [])

  return null
}
