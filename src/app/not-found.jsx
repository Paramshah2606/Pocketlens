import Link from "next/link"
import { Logo } from "@/components/ui/Logo"

export const metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo size="lg" asLink />
      <p className="mt-10 text-6xl font-extrabold tracking-tight text-blue-600">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">This page doesn&apos;t exist</h1>
      <p className="mt-2 max-w-sm text-slate-500">The link may be broken or the page may have moved.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 font-medium text-white shadow-sm hover:bg-primary/90">
          Go to dashboard
        </Link>
        <Link href="/" className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-6 font-medium text-slate-700 hover:bg-slate-50">
          Home page
        </Link>
      </div>
    </main>
  )
}
