// src/utils/config.ts
import { createWalletLinkConfig } from '@stability-nexus/walletlink'
import { http, type Transport } from 'viem'
import { GLUON_CHAINS, SEPOLIA_CHAIN_ID } from '@/utils/networks'

const sepoliaRpcUrl =
  (process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '').trim() ||
  'https://ethereum-sepolia-rpc.publicnode.com'

const transports = Object.fromEntries(
  GLUON_CHAINS.map((chain) => [
    chain.id,
    http(
      chain.id === SEPOLIA_CHAIN_ID
        ? sepoliaRpcUrl
        : chain.rpcUrls.default.http[0]
    ),
  ])
) as Record<number, Transport>

export const config = createWalletLinkConfig({
  chains: GLUON_CHAINS,
  transports,
  ssr: true,
})
