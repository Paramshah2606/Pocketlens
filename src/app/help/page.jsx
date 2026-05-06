import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Search, BookOpen, MessageCircle, HelpCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export const metadata = {
  title: "PocketLens Help Center — FAQs & Support",
  description: "Get answers to common PocketLens questions. Learn how to track expenses, manage budgets, and get the most out of PocketLens.",
  alternates: { canonical: '/help' },
}

export default function HelpPage() {
  const faqs = [
    {
      q: "Is PocketLens really free?",
      a: "Yes! PocketLens is completely free for individuals to track their personal expenses and manage budgets."
    },
    {
      q: "Can I export my data?",
      a: "We are currently working on an export feature that will allow you to download your data in CSV and PDF formats."
    },
    {
      q: "Is my data secure?",
      a: "Absolutely. We use industry-standard encryption to protect your data and ensure your privacy."
    },
    {
      q: "How do I reset my password?",
      a: "You can click on 'Forgot Password' on the login screen and follow the instructions sent to your email."
    }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(({ q, a }) => ({
              "@type": "Question",
              "name": q,
              "acceptedAnswer": { "@type": "Answer", "text": a }
            }))
          })
        }}
      />
      <main className="flex-1">
        <section className="py-20 bg-blue-600 text-white">
          <div className="container mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-extrabold mb-8 tracking-tight">How can we help?</h1>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search for articles, guides..." 
                className="h-14 pl-12 rounded-2xl bg-white text-slate-900 border-none shadow-xl text-lg focus-visible:ring-blue-400"
              />
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
              <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">User Guides</h3>
                <p className="text-slate-500 mb-6">Learn the basics and advanced tips.</p>
                <Link href="#" className="text-blue-600 font-bold hover:underline">Read Guides</Link>
              </div>
              <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <HelpCircle className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">FAQs</h3>
                <p className="text-slate-500 mb-6">Quick answers to common questions.</p>
                <Link href="#" className="text-indigo-600 font-bold hover:underline">View FAQs</Link>
              </div>
              <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Contact Support</h3>
                <p className="text-slate-500 mb-6">Still need help? Reach out to us.</p>
                <Link href="/contact" className="text-emerald-600 font-bold hover:underline">Get Support</Link>
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {faqs.map((faq, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <h4 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h4>
                    <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
