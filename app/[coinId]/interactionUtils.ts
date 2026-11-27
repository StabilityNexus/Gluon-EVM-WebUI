import {
  BaseError,
  CallExecutionError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
  decodeErrorResult,
  formatUnits,
  parseUnits,
  type Hex,
} from "viem"
import { StableCoinReactorABI } from "@/utils/abi/StableCoin"

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

export const mulDivUp = (a: bigint, b: bigint, denominator: bigint) => {
  if (denominator === 0n) return 0n
  return (a * b + denominator - 1n) / denominator
}

export const scaleToWad = (value?: bigint, decimals?: number) => {
  if (value === undefined || decimals === undefined) return undefined
  if (decimals === 0) return value * WAD
  const scale = pow10(decimals)
  return scale === 0n ? undefined : mulDiv(value, WAD, scale)
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

const revertErrorName = (error: BaseError) => {
  const reverted = error.walk((cause) => cause instanceof ContractFunctionRevertedError)
  if (reverted instanceof ContractFunctionRevertedError) return reverted.data?.errorName

  // wagmi replays a reverted receipt with eth_call. Its error only keeps the raw revert data.
  const withData = error.walk((cause) => {
    const data = (cause as { data?: unknown } | null)?.data
    return typeof data === "string" && data.startsWith("0x") && data.length >= 10
  }) as { data: Hex } | null
  if (!withData) return undefined
  try {
    return decodeErrorResult({ abi: StableCoinReactorABI, data: withData.data }).errorName
  } catch {
    return undefined
  }
}

export const describeTransactionError = (error: unknown) => {
  if (!(error instanceof BaseError)) return "The transaction did not succeed."
  if (error.walk((cause) => cause instanceof UserRejectedRequestError)) {
    return "The request was rejected in your wallet."
  }
  // Wallets often report this as an internal error, which viem reads as a revert.
  if (InsufficientFundsError.nodeMessage.test(error.message)) {
    return "Not enough funds to pay for gas."
  }

  const reverted = error.walk((cause) => cause instanceof ContractFunctionRevertedError)
  if (reverted instanceof ContractFunctionRevertedError && reverted.reason) {
    return reverted.reason
  }

  const errorName = revertErrorName(error)
  if (errorName === "ExcessiveSlippage") {
    return "The price moved before the transaction was mined. Check the new quote and try again."
  }
  if (errorName && errorName !== "Error" && errorName !== "Panic") {
    return `The contract reverted with ${errorName}.`
  }
  return error.shortMessage
}

// wagmi replays the call only after a reverted receipt. Any other receipt error leaves the status unknown.
export const isRevertedReceiptError = (error: Error) =>
  !(error instanceof BaseError) ||
  Boolean(error.walk((cause) => cause instanceof CallExecutionError))
