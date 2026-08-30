import type { Chain } from "viem"
import { scrollSepolia, sepolia } from "wagmi/chains"
import { citreaTestnet } from "@/components/CitreaTestnet"
import { rootstockTestnet } from "@/components/RootstockTestnet"

export const GLUON_NETWORKS = [
  {
    chain: sepolia,
    displayName: "Ethereum Sepolia",
    factoryAddress: "0x320abd0dcC221049A2b49F8965a76ed5bA20396f",
  },
  {
    chain: scrollSepolia,
    displayName: "Scroll Sepolia",
    factoryAddress: "0x25f8c10A5280414f86e26cCA9Dc5206DA7d4135F",
  },
  {
    chain: citreaTestnet,
    displayName: "Citrea Testnet",
    factoryAddress: "0xd9E7848Ba881DABb8AF8C7b37fB681039B83DE50",
  },
  {
    chain: rootstockTestnet,
    displayName: "Rootstock Testnet",
    factoryAddress: "0xb8e5EcA6a81eA96F7B4B02d645361435238E99d2",
  },
] as const

export const GLUON_CHAINS: [Chain, ...Chain[]] = [
  GLUON_NETWORKS[0].chain,
  ...GLUON_NETWORKS.slice(1).map(({ chain }) => chain),
]
