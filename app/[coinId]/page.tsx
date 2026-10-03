import InteractionClient from './InteractionClient'
import { Suspense } from 'react'

export async function generateStaticParams() {
  return [{ coinId: 'c' }]
}

// Enable dynamic routing for contract addresses not in generateStaticParams
export const dynamicParams = false

export default function CoinDetailPage({ params }: { params: { coinId: string } }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <InteractionClient coinId={params.coinId} />
    </Suspense>
  )
}
