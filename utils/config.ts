// src/utils/config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { fallback, http, type Transport } from 'viem'
import { sepolia } from 'wagmi/chains'
import { GLUON_CHAINS } from '@/utils/networks'

// viem's default Sepolia RPC is sepolia.drpc.org, whose free plan no longer serves Sepolia
// (HTTP 400, code 35), so every read fails without a wallet RPC. Measured 2026-10-03.
const SEPOLIA_RPC_URLS = ['https://ethereum-sepolia-rpc.publicnode.com']

const transports = Object.fromEntries(
  GLUON_CHAINS.map((chain) => [
    chain.id,
    chain.id === sepolia.id
      ? fallback([...SEPOLIA_RPC_URLS.map((url) => http(url)), http()])
      : http(),
  ]),
) as Record<(typeof GLUON_CHAINS)[number]['id'], Transport>

  
// Sanitize the project ID to avoid stray quotes/semicolons that break the WalletConnect API URL
const walletConnectProjectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '').replace(/["';]/g, '').trim()

// Fallback project ID if not provided - this prevents Coinbase wallet errors
const projectId = walletConnectProjectId || 'fallback-project-id-for-development'

export const config = getDefaultConfig({
  appName: 'StableCoin',
  projectId: projectId,
  chains: GLUON_CHAINS,
  transports,
  ssr: true,
})
