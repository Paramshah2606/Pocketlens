import { Logo } from "@/components/ui/Logo"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-16">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Logo size="md" className="mb-6" />
            <p className="text-sm text-slate-500 leading-relaxed">
              Smart expense tracking for modern lives. Simple, beautiful, and completely free.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Product</h4>
            <ul className="space-y-4">
              <li><Link href="/features" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Features</Link></li>
              <li><Link href="/how-it-works" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">How it Works</Link></li>
              <li><Link href="/pricing" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">About Us</Link></li>
              <li><Link href="/privacy" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link href="/help" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} PocketLens. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {/* Social links placeholder */}
          </div>
        </div>
      </div>
    </footer>
  )
}
