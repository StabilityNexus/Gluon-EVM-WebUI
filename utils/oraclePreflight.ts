import { getAddress, isAddress, type PublicClient } from "viem"
import { IOracleABI } from "@/utils/abi/IOracle"

export type OraclePreflightStatus = "compatible" | "warning" | "blocked"

export interface OraclePreflightResult {
  chainId: number
  address: string
  status: OraclePreflightStatus
  value?: bigint
  minValue?: bigint
  maxValue?: bigint
  lastUpdated?: bigint
  ageSeconds?: bigint
  description?: string
  issues: string[]
  warnings: string[]
}

interface OracleReadResults {
  value?: bigint
  interval?: readonly [bigint, bigint]
  lastUpdated?: bigint
  description?: string
}

export async function runOraclePreflight(
  publicClient: PublicClient,
  addressInput: string,
  chainId: number
): Promise<OraclePreflightResult> {
  const issues: string[] = []
  const warnings: string[] = []
  const trimmedAddress = addressInput.trim()

  if (!isAddress(trimmedAddress, { strict: false })) {
    return {
      chainId,
      address: trimmedAddress,
      status: "blocked",
      issues: ["Oracle address is not a valid EVM address."],
      warnings,
    }
  }

  const address = getAddress(trimmedAddress.toLowerCase())

  const rpcChainId = await publicClient.getChainId()
  if (rpcChainId !== chainId) {
    throw new Error(
      `Oracle preflight RPC chain mismatch: expected ${chainId}, received ${rpcChainId}.`
    )
  }

  const latestBlock = await publicClient.getBlock({ blockTag: "latest" })
  const blockNumber = latestBlock.number

  const bytecode = await publicClient.getBytecode({
    address,
    blockNumber,
  })

  if (!bytecode || bytecode === "0x") {
    return {
      chainId,
      address,
      status: "blocked",
      issues: ["No contract is deployed at this address on the current network."],
      warnings,
    }
  }

  const [valueResult, intervalResult, timestampResult, descriptionResult] =
    await Promise.allSettled([
      publicClient.readContract({
        address,
        abi: IOracleABI,
        functionName: "readValue",
        blockNumber,
      }),
      publicClient.readContract({
        address,
        abi: IOracleABI,
        functionName: "readValueInterval",
        blockNumber,
      }),
      publicClient.readContract({
        address,
        abi: IOracleABI,
        functionName: "lastUpdated",
        blockNumber,
      }),
      publicClient.readContract({
        address,
        abi: IOracleABI,
        functionName: "description",
        blockNumber,
      }),
    ])

  const allReadsFailed = [
    valueResult,
    intervalResult,
    timestampResult,
    descriptionResult,
  ].every((result) => result.status === "rejected")

  // If every contract read failed, make sure this was not an RPC outage
  // before classifying the contract as incompatible.
  if (allReadsFailed) {
    await publicClient.getBlockNumber()
  }

  const reads: OracleReadResults = {}

  if (valueResult.status === "fulfilled") {
    reads.value = valueResult.value
    if (reads.value === BigInt(0)) {
      issues.push("readValue() returned zero.")
    }
  } else {
    issues.push("readValue() could not be read.")
  }

  if (intervalResult.status === "fulfilled") {
    reads.interval = intervalResult.value

    const [minValue, maxValue] = reads.interval

    if (minValue === BigInt(0) || maxValue === BigInt(0)) {
      issues.push("readValueInterval() returned a zero price bound.")
    }

    if (minValue > maxValue) {
      issues.push("readValueInterval() returned a minimum above the maximum.")
    }

    if (
      reads.value !== undefined &&
      (reads.value < minValue || reads.value > maxValue)
    ) {
      issues.push("The current oracle value falls outside its reported interval.")
    }
  } else {
    issues.push("readValueInterval() could not be read.")
  }

  if (timestampResult.status === "fulfilled") {
    reads.lastUpdated = timestampResult.value

    if (reads.lastUpdated === BigInt(0)) {
      issues.push("lastUpdated() returned a zero timestamp.")
    } else if (reads.lastUpdated > latestBlock.timestamp) {
      issues.push("lastUpdated() returned a timestamp ahead of the latest block.")
    }
  } else {
    issues.push("lastUpdated() could not be read.")
  }

  if (descriptionResult.status === "fulfilled") {
    reads.description = descriptionResult.value.trim()

    if (!reads.description) {
      warnings.push("The oracle returned an empty description.")
    }
  } else {
    issues.push("description() could not be read.")
  }

  const ageSeconds =
    reads.lastUpdated !== undefined &&
    reads.lastUpdated > BigInt(0) &&
    reads.lastUpdated <= latestBlock.timestamp
      ? latestBlock.timestamp - reads.lastUpdated
      : undefined

  return {
    chainId,
    address,
    status:
      issues.length > 0
        ? "blocked"
        : warnings.length > 0
          ? "warning"
          : "compatible",
    value: reads.value,
    minValue: reads.interval?.[0],
    maxValue: reads.interval?.[1],
    lastUpdated: reads.lastUpdated,
    ageSeconds,
    description: reads.description,
    issues,
    warnings,
  }
}
