import Link from "next/link"
import { ArrowRight, PieChart, Zap, Target, LayoutDashboard, Wallet, TrendingUp, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/Logo"
import { MockChart } from "@/components/ui/MockChart"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export const metadata = {
  title: 'PocketLens | Smart Expense Tracking for Modern Lives',
  description: 'Track expenses instantly, gain deep insights, and manage your budgets effortlessly. PocketLens is the mobile-first expense tracker built for young professionals and students.',
  openGraph: {
    title: 'PocketLens | Smart Expense Tracking for Modern Lives',
    description: 'Track expenses instantly, gain deep insights, and manage your budgets effortlessly. PocketLens is the mobile-first expense tracker built for young professionals and students.',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PocketLens | Smart Expense Tracking for Modern Lives',
    description: 'Track expenses instantly, gain deep insights, and manage your budgets effortlessly. PocketLens is the mobile-first expense tracker built for young professionals and students.',
  },
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
          {/* Decorative background blobs */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-50/50 blur-[100px] rounded-full opacity-60" />
            <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-indigo-50/50 blur-[80px] rounded-full opacity-60 hidden md:block" />
          </div>

          <div className="container mx-auto max-w-6xl px-6 relative z-10 text-center">
            <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50/50 px-3 py-1 text-sm font-medium text-blue-600 mb-8 shadow-sm backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
              Now available for everyone
            </div>
            
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl md:text-7xl leading-[1.1]">
              See exactly where your money goes. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Instantly.</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl leading-relaxed">
              The smartest way to track expenses, set budgets, and gain meaningful insights into your spending habits. Designed for mobile, built for speed.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full px-8 shadow-md shadow-blue-500/10 transition-all hover:-translate-y-0.5">
                <Link href="/signup">
                  Get Started for Free
                  {/* <ArrowRight className="ml-2 h-5 w-5" /> */}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-8 border-slate-200 text-slate-400 hover:bg-slate-50 transition-all">
                <Link href="/login">View Live Demo</Link>
              </Button>
            </div>
            
            {/* Mockup Preview */}
            <div className="mt-20 mx-auto max-w-5xl rounded-3xl border border-slate-200/60 bg-white/50 p-2 sm:p-4 shadow-2xl shadow-blue-500/10 backdrop-blur-sm">
              <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex flex-col md:flex-row relative shadow-inner">
                 
                 {/* Fake Sidebar */}
                 <div className="hidden md:flex flex-col w-48 border-r border-slate-200 bg-white p-4 items-start gap-4">
                   <div className="w-24 h-6 bg-slate-100 rounded-md mb-4" />
                   <div className="w-full h-8 bg-blue-50 rounded-md flex items-center px-2 gap-2 text-blue-600">
                     <LayoutDashboard className="h-4 w-4" />
                     <div className="w-16 h-3 bg-blue-200 rounded-full" />
                   </div>
                   <div className="w-full h-8 flex items-center px-2 gap-2 text-slate-400">
                     <Wallet className="h-4 w-4" />
                     <div className="w-16 h-3 bg-slate-200 rounded-full" />
                   </div>
                   <div className="w-full h-8 flex items-center px-2 gap-2 text-slate-400">
                     <Target className="h-4 w-4" />
                     <div className="w-20 h-3 bg-slate-200 rounded-full" />
                   </div>
                 </div>

                 {/* Fake Main Content */}
                 <div className="flex-1 p-6 sm:p-8 bg-slate-50 text-left">
                   <div className="flex justify-between items-center mb-8">
                     <div>
                       <h3 className="text-xl font-bold text-slate-900">Dashboard Overview</h3>
                       <p className="text-xs text-slate-500 mt-1">Your financial summary for this month</p>
                     </div>
                     <div className="h-10 w-28 bg-primary text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-sm shadow-blue-500/20">
                       + Add Expense
                     </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                     <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Wallet className="h-4 w-4" /></div>
                         <span className="text-xs font-semibold text-slate-500">Total Spent</span>
                       </div>
                       <div className="text-2xl font-bold text-slate-900">₹24,500</div>
                     </div>
                     <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp className="h-4 w-4" /></div>
                         <span className="text-xs font-semibold text-slate-500">Income</span>
                       </div>
                       <div className="text-2xl font-bold text-slate-900">₹85,000</div>
                     </div>
                     <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                         <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><CreditCard className="h-4 w-4" /></div>
                         <span className="text-xs font-semibold text-slate-500">Active Budgets</span>
                       </div>
                       <div className="text-2xl font-bold text-slate-900">3</div>
                     </div>
                   </div>

                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                     <h4 className="text-sm font-bold text-slate-900 mb-6">Spending Trend</h4>
                     <div style={{ width: '100%', height: 200, minWidth: 0 }}>
                       <MockChart />
                     </div>
                   </div>

                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-slate-100 bg-white py-24 lg:py-32">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Everything you need to master your finances
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Powerful features wrapped in a beautifully simple interface. Stop wondering where your money went.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">Lightning Fast Entry</h3>
                <p className="text-slate-600 leading-relaxed">
                  Log your expenses in seconds with our mobile-first quick add interface and smart default categories. Never miss a transaction again.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <PieChart className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">Deep Insights</h3>
                <p className="text-slate-600 leading-relaxed">
                  Visualize your spending habits with dynamic, interactive charts. Compare monthly trends and identify unusual spikes instantly.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">Smart Budgets</h3>
                <p className="text-slate-600 leading-relaxed">
                  Set dynamic limits by category and get notified before you overspend. Stay in complete control of your financial goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-slate-100 bg-slate-50 py-24">
          <div className="container mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl mb-6">
              Ready to take control of your money?
            </h2>
            <p className="text-lg text-slate-600 mb-10">
              Join today and experience the easiest way to track your expenses. Free forever for individuals.
            </p>
            <Button asChild size="lg" className="h-14 rounded-full px-10 shadow-lg shadow-blue-500/20 text-base">
              <Link href="/signup">Create your free account</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
