"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// The readable "logged_in" hint cookie (set next to the httpOnly auth cookie) tells
// public pages whether to offer "Open app" instead of "Log in / Sign up".
function isLoggedIn() {
  return document.cookie.split("; ").some((c) => c === "logged_in=1")
}

export function NavbarAuthLinks() {
  const loggedIn = useSyncExternalStore(() => () => {}, isLoggedIn, () => false)

  if (loggedIn) {
    return (
      <Button asChild size="sm" className="rounded-full px-5 shadow-sm">
        <Link href="/dashboard">
          Open app <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    )
  }

  return (
    <>
      <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
        Log in
      </Link>
      <Button asChild size="sm" className="rounded-full px-5 shadow-sm">
        <Link href="/signup">Sign up free</Link>
      </Button>
    </>
  )
}
