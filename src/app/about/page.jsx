import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Shield, Users, Heart } from "lucide-react"

export const metadata = {
  title: "About PocketLens — Our Story & Mission",
  description: "PocketLens was built to make personal finance simple and accessible. Learn about the story, mission, and values behind the PocketLens expense tracker.",
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
              Empowering your <span className="text-blue-600">financial freedom</span>.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              PocketLens was born from a simple observation: tracking money shouldn't feel like a chore. 
              We've built a tool that's as fast as your daily spending and as deep as your long-term goals.
            </p>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Privacy First</h3>
                <p className="text-slate-500 leading-relaxed">
                  Your data is yours alone. We use industry-standard encryption to ensure your financial life stays private.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Community Focused</h3>
                <p className="text-slate-500 leading-relaxed">
                  Designed for students, young professionals, and everyone in between who wants a better way to manage cash.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Built with Love</h3>
                <p className="text-slate-500 leading-relaxed">
                  We care deeply about user experience. Every feature is crafted to be intuitive, fast, and beautiful.
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
