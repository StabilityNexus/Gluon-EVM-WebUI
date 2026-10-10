import { parseUnits, formatUnits } from "viem"

export type TokenOption = "BASE" | "BUNDLE" | "NEUTRON" | "PROTON"

export type SwapRoute =
  "FISSION" | "FUSION" | "PROTON_TO_NEUTRON" | "NEUTRON_TO_PROTON"

export const allowedTargets: Record<TokenOption, TokenOption[]> = {
  BASE: ["BUNDLE"],
  BUNDLE: ["BASE"],
  NEUTRON: ["PROTON"],
  PROTON: ["NEUTRON"],
}

export const routeMap: Record<string, SwapRoute> = {
  "BASE->BUNDLE": "FISSION",
  "BUNDLE->BASE": "FUSION",
  "PROTON->NEUTRON": "PROTON_TO_NEUTRON",
  "NEUTRON->PROTON": "NEUTRON_TO_PROTON",
}

export const formatPercentFromWad = (value?: bigint) => {
  if (!value) return "0.0%"
  const percent = Number(value) / 1e16
  return `${percent.toFixed(1)}%`
}

export const trimFormattedAmount = (value: string, precision = 6) => {
  const [integer, fraction] = value.split(".")
  if (!fraction) return integer
  const sliced = fraction.slice(0, precision).replace(/0+$/, "")
  return sliced.length ? `${integer}.${sliced}` : integer
}

export const formatBalance = (
  balance?: bigint,
  decimals?: number,
  precision = 4,
) => {
  if (balance === undefined || decimals === undefined) return "0"
  const formatted = formatUnits(balance, decimals)
  return trimFormattedAmount(formatted, precision)
}

export const pow10 = (decimals: number) => BigInt(10) ** BigInt(decimals)

export const safeParseUnits = (value: string, decimals?: number) => {
  if (decimals === undefined) return null
  if (!value || Number(value) === 0) return BigInt(0)
  try {
    return parseUnits(value, decimals)
  } catch (error) {
    console.error("Failed to parse units:", error)
    return null
  }
}

export const shortenAddress = (value?: string, guard = 4) => {
  if (!value) return "—"
  if (value.length <= guard * 2 + 3) return value
  return `${value.slice(0, guard + 2)}…${value.slice(-guard)}`
}

export const WAD = 10n ** 18n

export const PEGGED_ASSET_WAD = 10n ** 18n

export const NATIVE_FLOW_CONTEXT_CHANGED = "NATIVE_FLOW_CONTEXT_CHANGED"

export const mulDiv = (a: bigint, b: bigint, denominator: bigint) => {
  if (denominator === 0n) return 0n
  return (a * b) / denominator
}

export const scaleToWad = (value?: bigint, decimals?: number) => {
  if (value === undefined || decimals === undefined) return undefined
  if (decimals === 0) return value * WAD
  const scale = pow10(decimals)
  return scale === 0n ? undefined : mulDiv(value, WAD, scale)
}

export const computeQWad = (
  reserveWad?: bigint,
  neutronSupplyWad?: bigint,
  basePriceWad?: bigint,
  criticalReserveRatio?: bigint,
): bigint | undefined => {
  if (
    reserveWad === undefined ||
    neutronSupplyWad === undefined ||
    basePriceWad === undefined ||
    basePriceWad === 0n
  ) {
    return undefined
  }
  if (neutronSupplyWad === 0n) return 0n

  const pStarBaseWad = mulDiv(WAD, WAD, basePriceWad)
  if (pStarBaseWad === 0n) return undefined

  const denom = mulDiv(neutronSupplyWad, pStarBaseWad, WAD)
  if (denom === 0n) return undefined

  const rWad = mulDiv(reserveWad, WAD, denom)
  const critical =
    criticalReserveRatio && criticalReserveRatio > 0n
      ? criticalReserveRatio
      : WAD
  let rTilde = rWad
  if (rWad <= critical) {
    const diff = critical > WAD ? critical - WAD : 0n
    const rOverStar = mulDiv(rWad, WAD, critical === 0n ? WAD : critical)
    const part = mulDiv(rOverStar, diff, WAD)
    rTilde = WAD + part
  }
  if (rTilde === 0n) return undefined
  const q = mulDiv(WAD, WAD, rTilde)
  return q > WAD ? WAD : q
}

export type InfoRow = {
  label: string
  value: string
  monospace?: boolean
  emphasize?: boolean
}

export type InfoSection = {
  title: string
  description?: string
  items: InfoRow[]
}

export const formatTokenValue = (
  amount: bigint | null | undefined,
  decimals?: number,
  symbol?: string,
  precision = 6,
) => {
  if (amount === null || amount === undefined || decimals === undefined)
    return "—"
  const formatted = formatBalance(amount, decimals, precision)
  return symbol ? `${formatted} ${symbol}` : formatted
}

export const formatWad = (value?: bigint, precision = 4) => {
  if (value === undefined) return "—"
  const formatted = formatUnits(value, 18)
  return trimFormattedAmount(formatted, precision)
}
