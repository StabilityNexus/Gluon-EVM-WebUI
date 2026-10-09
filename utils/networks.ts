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
  factoryAddress: Address
  factorySupportsInitialReserve: boolean
  nativeAsset?: NativeAssetConfig
}

export const GLUON_NETWORKS: readonly GluonNetworkConfig[] = [
  {
    chain: sepolia,
    displayName: "Ethereum Sepolia",
    factoryAddress: "0x3Ca248b434DF95F20fc6469393D2e242243C47C6",
    factorySupportsInitialReserve: true,
  },
  {
    chain: scrollSepolia,
    displayName: "Scroll Sepolia",
    factoryAddress: "0x25f8c10A5280414f86e26cCA9Dc5206DA7d4135F",
    factorySupportsInitialReserve: false,
  },
  {
    chain: citreaTestnet,
    displayName: "Citrea Testnet",
    factoryAddress: "0xd9E7848Ba881DABb8AF8C7b37fB681039B83DE50",
    factorySupportsInitialReserve: false,
  },
  {
    chain: rootstockTestnet,
    displayName: "Rootstock Testnet",
    factoryAddress: "0xb8e5EcA6a81eA96F7B4B02d645361435238E99d2",
    factorySupportsInitialReserve: false,
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
