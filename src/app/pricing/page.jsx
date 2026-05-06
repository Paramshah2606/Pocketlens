import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Check, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
  title: "PocketLens Pricing — Free Expense Tracker for Everyone",
  description: "PocketLens is completely free. No subscriptions, no hidden fees. Start tracking your expenses with PocketLens today — zero cost, forever.",
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
                Simple, transparent <span className="text-blue-600">pricing</span>.
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                No monthly fees, no hidden costs. PocketLens is built for everyone.
              </p>
            </div>

            <div className="max-w-md mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative p-10 bg-white border border-slate-100 rounded-[2rem] shadow-xl">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600 mb-4">
                    COMMUNITY PLAN
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-5xl font-extrabold text-slate-900">₹0</span>
                    <span className="text-slate-500 font-medium">/ forever</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {[
                    "Unlimited expenses",
                    "Unlimited categories",
                    "Real-time budgets",
                    "Visual insights",
                    "Mobile-first experience",
                    "Secure cloud sync"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-slate-600 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full h-14 rounded-2xl shadow-lg shadow-blue-200 text-lg font-bold" size="lg">
                  <Link href="/signup">Get started free</Link>
                </Button>

                <p className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                  Built with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> for the community.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
