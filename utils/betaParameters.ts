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
  volumeRetentionPerSecond: string
}) {
  return {
    betaPhi0: parseFraction(config.betaFeePercent, 16, "Base transmutation fee"),
    betaPhi1: parseFraction(config.betaVolumeCoefficient, 18, "Volume fee coefficient"),
    decayPerSecondWad: parseFraction(config.volumeRetentionPerSecond, 18, "Volume retention"),
  }
}
