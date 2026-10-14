import type { Address } from "viem"
import { GLUON_NETWORKS } from "@/utils/networks"

export const StableCoinFactories: Partial<Record<number, Address>> = Object.fromEntries(
  GLUON_NETWORKS.flatMap(({ chain, factoryAddress }) =>
    factoryAddress ? [[chain.id, factoryAddress]] : []
  )
)
