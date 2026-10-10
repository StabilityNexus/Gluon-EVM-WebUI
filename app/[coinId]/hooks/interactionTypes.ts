import type { Address } from "viem"

export type InteractionContext = {
  reactorAddress: string
  address: Address | undefined
  chainId: number
}
