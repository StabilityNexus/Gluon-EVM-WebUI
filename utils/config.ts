// src/utils/config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http, type Transport } from 'viem'
import { GLUON_CHAINS } from '@/utils/networks'

  
// Sanitize the project ID to avoid stray quotes/semicolons that break the WalletConnect API URL
const walletConnectProjectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '').replace(/["';]/g, '').trim()

// Fallback project ID if not provided - this prevents Coinbase wallet errors
const projectId = walletConnectProjectId || 'fallback-project-id-for-development'

const sepoliaRpcUrl =
  (process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '').trim() ||
  'https://ethereum-sepolia-rpc.publicnode.com'

const transports = Object.fromEntries(
  GLUON_CHAINS.map((chain) => [
    chain.id,
    http(
      chain.id === 11155111
        ? sepoliaRpcUrl
        : chain.rpcUrls.default.http[0]
    ),
  ])
) as Record<number, Transport>

export const config = getDefaultConfig({
  appName: 'StableCoin',
  projectId: projectId,
  chains: GLUON_CHAINS,
  transports,
  ssr: true,
})
