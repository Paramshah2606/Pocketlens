import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Zap, PieChart, Target, Smartphone, Globe, Lock } from "lucide-react"

export const metadata = {
  title: "PocketLens Features — Expense Tracking, Smart Budgets & Insights",
  description: "Discover PocketLens features: instant expense logging, interactive spending charts, smart budget alerts, and secure cloud sync. Free expense tracker for everyone.",
  alternates: { canonical: '/features' },
}

export default function FeaturesPage() {
  const features = [
    {
      title: "Instant Tracking",
      description: "Log expenses in seconds with our optimized mobile-first interface.",
      icon: Zap,
      color: "blue"
    },
    {
      title: "Deep Insights",
      description: "Visualize your spending patterns with beautiful, interactive charts.",
      icon: PieChart,
      color: "indigo"
    },
    {
      title: "Smart Budgets",
      description: "Set custom limits and track progress in real-time by category.",
      icon: Target,
      color: "emerald"
    },
    {
      title: "Cloud Sync",
      description: "Access your data from any device, anywhere in the world.",
      icon: Globe,
      color: "amber"
    },
    {
      title: "Mobile Ready",
      description: "A responsive design that works perfectly on your smartphone.",
      icon: Smartphone,
      color: "purple"
    },
    {
      title: "Bank-Grade Security",
      description: "Your data is encrypted and protected with modern security standards.",
      icon: Lock,
      color: "rose"
    }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
                Everything you need to <span className="text-blue-600">master</span> your money.
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Simple enough for daily use, powerful enough for serious financial planning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                  <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-${feature.color}-50 text-${feature.color}-600`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
