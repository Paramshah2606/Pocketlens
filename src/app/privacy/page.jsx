import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export const metadata = {
  title: "Privacy Policy | PocketLens",
  description: "Learn how we collect, use, and protect your personal information.",
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 py-24">
        <div className="container mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-8">Privacy Policy</h1>
          <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <p><strong>Effective Date:</strong> May 6, 2026</p>
            <p>
              At PocketLens, we take your privacy seriously. This Privacy Policy explains how we collect, use, and share information about you when you use our website and services.
            </p>
            
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, log an expense, or contact us for support. This may include your name, email address, and financial transaction data.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to protect the security of our platform.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data from unauthorized access, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. Sharing of Information</h2>
            <p>
              We do not sell your personal information to third parties. We may share your information only to comply with legal obligations or to protect our rights.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@pocketlens.app.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
