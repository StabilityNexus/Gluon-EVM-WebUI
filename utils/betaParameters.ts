import { parseUnits } from "viem"

const WAD = 10n ** 18n

function parseFraction(value: string, decimals: number, label: string) {
  const text = value.trim()
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
    throw new Error(`${label} must be a nonnegative decimal number`)
  }
  if ((text.split(".")[1]?.length ?? 0) > decimals) {
    throw new Error(`${label} supports at most ${decimals} decimal places`)
  }
  const parsed = parseUnits(text, decimals)
  if (parsed > WAD) {
    throw new Error(`${label} exceeds its allowed maximum`)
  }
  return parsed
}

export function parseBetaParameters(config: {
  betaFeePercent: string
  betaVolumeCoefficient: string
  volumeRetentionPerHour: string
}) {
  return {
    betaPhi0: parseFraction(config.betaFeePercent, 16, "Base transmutation fee"),
    betaPhi1: parseFraction(config.betaVolumeCoefficient, 18, "Volume fee coefficient"),
    decayPerSecondWad: retentionPerSecond(parseFraction(config.volumeRetentionPerHour, 18, "Volume retention")),
  }
}

const SECONDS_PER_HOUR = 3600n

// Match the contract's fixed-point exponentiation when translating display units.
export function retentionAfterHour(perSecond: bigint) {
  let result = WAD
  let power = perSecond
  for (let seconds = SECONDS_PER_HOUR; seconds > 0n; seconds /= 2n) {
    if (seconds % 2n !== 0n) result = result * power / WAD
    power = power * power / WAD
  }
  return result
}

export function retentionPerSecond(perHour: bigint) {
  if (perHour < 0n || perHour > WAD) throw new Error("Volume retention exceeds its allowed maximum")
  // Zero preserves the existing clear-after-one-second option.
  if (perHour === 0n || perHour === WAD) return perHour
  let low = 0n
  let high = WAD
  while (low < high) {
    const mid = (low + high) / 2n
    if (retentionAfterHour(mid) < perHour) low = mid + 1n
    else high = mid
  }
  return low
}
