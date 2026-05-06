import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ReduxProvider } from "@/components/ReduxProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pocketlenss.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'PocketLens — Smart Expense Tracking',
    template: '%s | PocketLens',
  },
  description: 'Track expenses instantly, gain deep insights, and manage your budgets effortlessly. PocketLens is the mobile-first expense tracker built for modern lives.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'PocketLens',
    title: 'PocketLens — Smart Expense Tracking',
    description: 'Track expenses instantly, gain deep insights, and manage your budgets effortlessly.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'PocketLens — Smart Expense Tracking' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PocketLens — Smart Expense Tracking',
    description: 'Track expenses instantly, gain deep insights, and manage your budgets effortlessly.',
    images: ['/opengraph-image'],
  },
  verification: {
    google: 'MLpCV1yUFupl8FE9jxjOT6RoBJhIoWNApQZep2_OMBY',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${siteUrl}/#organization`,
                  "name": "PocketLens",
                  "alternateName": ["pocket lens", "pocketlenss"],
                  "url": siteUrl,
                  "logo": {
                    "@type": "ImageObject",
                    "url": `${siteUrl}/opengraph-image`
                  },
                  "description": "PocketLens is the mobile-first expense tracker built for modern lives.",
                  "sameAs": []
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  "url": siteUrl,
                  "name": "PocketLens",
                  "publisher": { "@id": `${siteUrl}/#organization` },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${siteUrl}/help?q={search_term_string}`,
                    "query-input": "required name=search_term_string"
                  }
                }
              ]
            })
          }}
        />
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
