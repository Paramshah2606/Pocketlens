import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ReduxProvider } from "@/components/ReduxProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pocketlens.app'),
  title: {
    default: 'PocketLens — Smart Expense Tracking',
    template: '%s | PocketLens',
  },
  description: 'Track expenses instantly, gain deep insights, and manage your budgets effortlessly. PocketLens is the mobile-first expense tracker built for modern lives.',
  openGraph: {
    type: 'website',
    siteName: 'PocketLens',
    title: 'PocketLens — Smart Expense Tracking',
    description: 'Track expenses instantly, gain deep insights, and manage your budgets effortlessly.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PocketLens — Smart Expense Tracking',
    description: 'Track expenses instantly, gain deep insights, and manage your budgets effortlessly.',
  },
  verification: {
    google: 'MLpCV1yUFupl8FE9jxjOT6RoBJhIoWNApQZep2_OMBY',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
