import type { NativeAssetConfig } from "@/utils/networks"

const WAD = 10n ** 18n

export const addressesEqual = (
  left?: string,
  right?: string,
): boolean => {
  if (!left || !right) return false
  return left.toLowerCase() === right.toLowerCase()
}

export const resolveNativeAssetConfig = (
  config: NativeAssetConfig | undefined,
  baseToken: string | undefined,
  baseDecimals: number | undefined,
): NativeAssetConfig | undefined => {
  if (!config || baseDecimals === undefined) return undefined

  if (!addressesEqual(baseToken, config.wrappedNativeAddress)) {
    return undefined
  }

  if (config.nativeDecimals !== baseDecimals) {
    return undefined
  }

  return config
}

/**
 * Returns a gross fusion amount that covers the requested net output after
 * rounding the combined post-fee net down, matching the Reactor.
 */
export const grossFusionAmountForNet = (
  netBaseAmount: bigint,
  fusionFeeWad: bigint,
  devFeeWad: bigint = 0n,
): bigint | null => {
  if (netBaseAmount <= 0n) return null
  if (fusionFeeWad < 0n || devFeeWad < 0n || fusionFeeWad + devFeeWad >= WAD) return null

  const denominator = WAD - fusionFeeWad - devFeeWad

  return (netBaseAmount * WAD + denominator - 1n) / denominator
}
