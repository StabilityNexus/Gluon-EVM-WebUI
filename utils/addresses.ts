import { GLUON_NETWORKS } from "@/utils/networks"

export const StableCoinFactories = Object.fromEntries(
  GLUON_NETWORKS.map(({ chain, factoryAddress }) => [
    chain.id,
    factoryAddress,
  ])
) as {
  [key: number]: `0x${string}`
}
