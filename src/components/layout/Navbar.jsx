import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/Logo"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo size="md" asLink={true} />
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</Link>
          <Link href="/how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">How it Works</Link>
          <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Pricing</Link>
          <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">About</Link>
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
            Log in
          </Link>
          <Button asChild size="sm" className="rounded-full px-5 shadow-sm">
            <Link href="/signup">Sign up free</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
