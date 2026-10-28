import type { Address, Chain } from "viem"
import { base, bsc, classic, mainnet, polygon, sepolia } from "wagmi/chains"

export const MAINNET_CHAIN_ID = mainnet.id
export const SEPOLIA_CHAIN_ID = sepolia.id

export type NativeAssetConfig = {
  nativeSymbol: string
  nativeDecimals: number
  wrappedNativeAddress: Address
}

export type GluonNetworkConfig = {
  chain: Chain
  displayName: string
  // Configure only after verifying a factory with the current creation interface.
  factoryAddress?: Address
  // Discovery only; never used to deploy through an older factory interface.
  explorerFactoryAddress?: Address
  nativeAsset?: NativeAssetConfig
  oracles?: readonly { address: Address; name: string; provider: "existing" | "orb" }[]
}

export const GLUON_NETWORKS: readonly GluonNetworkConfig[] = [
  { chain: classic, displayName: "Ethereum Classic" },
  {
    chain: mainnet,
    displayName: "Ethereum",
    factoryAddress: "0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a",
  },
  { chain: polygon, displayName: "Polygon" },
  { chain: bsc, displayName: "BSC" },
  { chain: base, displayName: "Base" },
  {
    chain: sepolia,
    displayName: "Ethereum Sepolia",
    explorerFactoryAddress: "0x56a8c79dE3d8e21Dc60e2679c4e296Ac8A4b9F50",
    // Test oracle deployments recorded in Deployments.md; not mainnet addresses.
    oracles: [
      { address: "0xff2b1fca4aF0c9BCb576178e6989AA92819a0294", name: "Orb — test_s", provider: "orb" },
      { address: "0xf21077d705ff140e801288ffee1ff26b849f8d0f", name: "Chainlink — ETH / USD adapter", provider: "existing" },
    ],
  },
]

export const getGluonNetwork = (chainId?: number) =>
  GLUON_NETWORKS.find(({ chain }) => chain.id === chainId)

export const GLUON_CHAINS: [Chain, ...Chain[]] = [
  // Preserve the existing default with Sepolia as the default wallet network.
  sepolia,
  ...GLUON_NETWORKS.filter(({ chain }) => chain.id !== sepolia.id).map(({ chain }) => chain),
]
