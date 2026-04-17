import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/providers/Providers'
import { Navbar } from '@/components/navigation'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://send2.com'),
  title: {
    template: '%s | Send2 — Compare Money Transfer Rates',
    default: 'Send2 — Compare Money Transfer Rates',
  },
  description:
    'Find the best exchange rates and lowest fees for international money transfers. Compare 50+ providers instantly.',
  openGraph: {
    type: 'website',
    siteName: 'Send2',
    title: 'Send2 — Compare Money Transfer Rates',
    description:
      'Find the best exchange rates and lowest fees for international money transfers.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Send2' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@send2money',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex flex-1">
              <main className="flex-1 overflow-x-hidden">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
