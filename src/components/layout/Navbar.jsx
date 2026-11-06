import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { NavbarAuthLinks } from "@/components/layout/NavbarAuthLinks"
import { InstallAppButton } from "@/components/InstallApp"

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

        <div className="flex items-center gap-3 sm:gap-6">
          <InstallAppButton
            label={<span className="hidden sm:inline">Get the app</span>}
            aria-label="Install the PocketLens app"
            variant="ghost"
            size="sm"
            className="rounded-full px-2.5 sm:px-3 text-slate-600 hover:text-blue-600"
            iconClassName="mr-0 sm:mr-2 h-5 w-5 sm:h-4 sm:w-4"
          />
          <NavbarAuthLinks />
        </div>
      </div>
    </header>
  )
}
