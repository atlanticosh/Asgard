import type { Metadata } from 'next'
import './globals.css'
import WalletModal from '@/components/WalletModal'

export const metadata: Metadata = {
  title: 'ASGARD - The DeFi Survival Game',
  description: 'Survive the crypto apocalypse in the ultimate DeFi survival game. Trade, bridge, and compete with 1,000+ players for the $50K prize pool.',
  keywords: 'DeFi, Game, Crypto, Ethereum, Stellar, Bridge, Trading, Survival',
  authors: [{ name: 'ASGARD Team' }],
  openGraph: {
    title: 'ASGARD - The DeFi Survival Game',
    description: 'Survive the crypto apocalypse in the ultimate DeFi survival game',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ASGARD - The DeFi Survival Game',
    description: 'Survive the crypto apocalypse in the ultimate DeFi survival game',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <WalletModal />
      </body>
    </html>
  )
} 