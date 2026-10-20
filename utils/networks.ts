import type { Address, Chain } from "viem"
import { scrollSepolia, sepolia } from "wagmi/chains"
import { citreaTestnet } from "@/components/CitreaTestnet"
import { rootstockTestnet } from "@/components/RootstockTestnet"

export const SEPOLIA_CHAIN_ID = sepolia.id

export type NativeAssetConfig = {
  nativeSymbol: string
  nativeDecimals: number
  wrappedNativeAddress: Address
}

export type GluonNetworkConfig = {
  chain: Chain
  displayName: string
  // Set only after the current factory is deployed and verified on this chain.
  factoryAddress?: Address
  nativeAsset?: NativeAssetConfig
}

export const GLUON_NETWORKS: readonly GluonNetworkConfig[] = [
  {
    chain: sepolia,
    displayName: "Ethereum Sepolia",
    // Configure after the factory with deployer-selected reserve ratios is deployed and verified.
  },
  {
    chain: scrollSepolia,
    displayName: "Scroll Sepolia",
  },
  {
    chain: citreaTestnet,
    displayName: "Citrea Testnet",
  },
  {
    chain: rootstockTestnet,
    displayName: "Rootstock Testnet",
  },
]

export const getGluonNetwork = (chainId?: number) => {
  if (chainId === undefined) return undefined
  return GLUON_NETWORKS.find(({ chain }) => chain.id === chainId)
}

export const GLUON_CHAINS: [Chain, ...Chain[]] = [
  GLUON_NETWORKS[0].chain,
  ...GLUON_NETWORKS.slice(1).map(({ chain }) => chain),
]
