import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export const metadata = {
  title: "Terms of Service | PocketLens",
  description: "Read our terms and conditions for using the PocketLens platform.",
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 py-24">
        <div className="container mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-8">Terms of Service</h1>
          <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
            <p><strong>Effective Date:</strong> May 6, 2026</p>
            <p>
              By using PocketLens, you agree to these terms. Please read them carefully.
            </p>
            
            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Use of the Service</h2>
            <p>
              You must be at least 13 years old to use PocketLens. You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. User Content</h2>
            <p>
              You retain ownership of any data you upload to PocketLens. You grant us a limited license to host and process your data solely for the purpose of providing the service to you.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Prohibited Activities</h2>
            <p>
              You agree not to use PocketLens for any illegal purposes or to interfere with the operation of the service.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. Limitation of Liability</h2>
            <p>
              PocketLens is provided "as is" without any warranties. We are not liable for any financial losses or data issues resulting from the use of our service.
            </p>

            <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Your continued use of the service after such changes constitutes acceptance of the new terms.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
