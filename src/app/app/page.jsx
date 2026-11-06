"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { homePath } from "@/lib/useOpenAdd"

// "Open the app" entry point (after login, from the installed app icon, "Open app" links).
// Sends phones/tablets to the Add screen and laptops/desktops to the dashboard. The
// choice needs the screen size, so it happens in the browser.
export default function AppEntry() {
  const router = useRouter()

  useEffect(() => {
    router.replace(homePath())
  }, [router])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50" aria-busy="true">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Opening PocketLens" />
    </main>
  )
}
