// src/utils/config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { GLUON_CHAINS } from '@/utils/networks'

  
// Sanitize the project ID to avoid stray quotes/semicolons that break the WalletConnect API URL
const walletConnectProjectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '').replace(/["';]/g, '').trim()

// Fallback project ID if not provided - this prevents Coinbase wallet errors
const projectId = walletConnectProjectId || 'fallback-project-id-for-development'

export const config = getDefaultConfig({
  appName: 'StableCoin',
  projectId: projectId,
  chains: GLUON_CHAINS,
  ssr: true,
})
