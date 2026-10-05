/* eslint-disable @next/next/no-page-custom-font */
// Fonts are loaded from the App Router root layout and therefore apply application-wide.

import '@rainbow-me/rainbowkit/styles.css'
import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { WalletProvider } from '@/providers/WalletProvider'
import Navigation from '@/components/navigation'
import ClientFooter from '@/components/ClientFooter'
import gluonLogo from '@/public/GluonProtocol-Darker.png'

export const metadata: Metadata = {
  title: 'Gluon | Decentralized Stablecoin Creation Platform',
  description: 'Gluon is a decentralized platform for creating and managing stablecoins. Build custom stablecoin reactors, manage collateral, and create algorithmic stablecoins with advanced DeFi mechanisms. Powered by The Stable Order.',
  keywords: [
    'Gluon',
    'stablecoin',
    'DeFi',
    'decentralized finance',
    'algorithmic stablecoin',
    'collateral',
    'reactor',
    'Ethereum',
    'Polygon',
    'BSC',
    'Base',
    'Stability Nexus',
    'The Stable Order',
    'smart contracts',
    'Web3',
    'cryptocurrency',
    'stablecoin creation',
  ],
  authors: [{ name: 'The Stable Order', url: 'https://stability.nexus' }],
  creator: 'The Stable Order',
  publisher: 'The Stable Order',
  applicationName: 'Gluon',
  category: 'Finance',
  generator: 'Next.js',
  metadataBase: new URL('https://gluon.stability.nexus'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: gluonLogo.src,
    shortcut: gluonLogo.src,
    apple: gluonLogo.src,
  },
  openGraph: {
    title: 'Gluon | Decentralized Stablecoin Creation Platform',
    description: 'Gluon is a decentralized platform for creating and managing stablecoins. Build custom stablecoin reactors and create algorithmic stablecoins with advanced DeFi mechanisms.',
    url: 'https://gluon.stability.nexus',
    siteName: 'Gluon',
    images: [
      {
        url: 'https://gluon.stability.nexus/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gluon - Decentralized Stablecoin Creation Platform',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gluon | Decentralized Stablecoin Creation Platform',
    description: 'Gluon is a decentralized platform for creating and managing stablecoins. Build custom stablecoin reactors and create algorithmic stablecoins.',
    images: ['https://gluon.stability.nexus/og-image.png'],
    creator: '@StabilityNexus',
    site: '@StabilityNexus',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:type': 'image/png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
            >
              Skip to content
            </a>
            <Navigation />
            <main id="main" className="flex-grow pt-20">
              {children}
            </main>
            <ClientFooter />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
