import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { UserPlus, PlusCircle, BarChart3 } from "lucide-react"

export const metadata = {
  title: "How PocketLens Works — Simple Expense Tracking in 3 Steps",
  description: "Learn how PocketLens helps you track expenses in seconds. Sign up, log your first expense, and start gaining insights into your spending immediately.",
  alternates: { canonical: '/how-it-works' },
}

export default function HowItWorksPage() {
  const steps = [
    {
      title: "Create an Account",
      description: "Sign up in seconds. All you need is an email to start your journey to better financial health.",
      icon: UserPlus,
      step: "01"
    },
    {
      title: "Log Your Expenses",
      description: "Enter your daily spending as it happens. Categories help you stay organized without the effort.",
      icon: PlusCircle,
      step: "02"
    },
    {
      title: "Analyze & Optimize",
      description: "View your trends, check your budget progress, and see where you can save more each month.",
      icon: BarChart3,
      step: "03"
    }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
                Master your finances in <span className="text-blue-600">3 simple steps</span>.
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                No complicated spreadsheets or bank connections. Just simple, intuitive tracking.
              </p>
            </div>

            <div className="space-y-12 max-w-4xl mx-auto">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center gap-8 md:gap-16 p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
                  <div className="flex-shrink-0 flex items-center justify-center h-20 w-20 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                    <step.icon className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-2">Step {step.step}</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-lg">{step.description}</p>
                  </div>
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
