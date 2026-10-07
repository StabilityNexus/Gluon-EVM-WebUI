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
  helperWrappedNative: string | undefined,
): NativeAssetConfig | undefined => {
  if (!config) return undefined

  if (!addressesEqual(baseToken, config.wrappedNativeAddress)) {
    return undefined
  }

  if (!addressesEqual(helperWrappedNative, config.wrappedNativeAddress)) {
    return undefined
  }

  return config
}

/**
 * Returns the smallest gross fusion amount `m` whose Solidity fee calculation
 * leaves at least `netBaseAmount` for the recipient.
 *
 * Reactor:
 *   fee = floor(m * fusionFeeWad / WAD)
 *   net = m - fee
 */
export const grossFusionAmountForNet = (
  netBaseAmount: bigint,
  fusionFeeWad: bigint,
): bigint | null => {
  if (netBaseAmount <= 0n) return null
  if (fusionFeeWad < 0n || fusionFeeWad >= WAD) return null

  const denominator = WAD - fusionFeeWad

  // Because:
  // m - floor(m * fee / WAD)
  //   = ceil(m * (WAD - fee) / WAD)
  //
  // This is the minimum integer m whose net output reaches netBaseAmount.
  return ((netBaseAmount - 1n) * WAD) / denominator + 1n
}
