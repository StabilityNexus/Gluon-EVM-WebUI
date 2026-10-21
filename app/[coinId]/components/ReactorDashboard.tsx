"use client"

import { useRef, useState } from "react"
import { formatUnits, isAddress, maxUint256, parseEventLogs } from "viem"
import {
  useAccount,
  usePublicClient,
  useReadContracts,
  useWriteContract,
} from "wagmi"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { StableCoinReactorABI } from "@/utils/abi/StableCoin"
import { getGluonNetwork } from "@/utils/networks"
import { formatPercentFromWad, formatWad, WAD } from "../interactionUtils"

export function ReactorDashboard({
  reactorAddress,
  chainId,
  baseDecimals,
  baseSymbol,
  onAdjusted,
}: {
  reactorAddress: string
  chainId: number
  baseDecimals?: number
  baseSymbol: string
  onAdjusted: () => Promise<unknown>
}) {
  const account = useAccount()
  const latestAccount = useRef(account)
  latestAccount.current = account
  const client = usePublicClient({ chainId })
  const { writeContractAsync, isPending } = useWriteContract()
  const [confirming, setConfirming] = useState(false)
  const [submitted, setSubmitted] = useState<`0x${string}`>()
  const { data, refetch } = useReadContracts({
    contracts: (
      [
        "reserveRatioPeggedAsset",
        "CRITICAL_RESERVE_RATIO",
        "UPPER_RESERVE_RATIO",
        "pegFactor",
        "reserve",
      ] as const
    ).map((functionName) => ({
      address: reactorAddress as `0x${string}`,
      abi: StableCoinReactorABI,
      functionName,
      chainId,
    })),
    query: { enabled: isAddress(reactorAddress), refetchInterval: 15_000 },
  })
  const [ratio, critical, upper, peg, reserve] = (data ?? []).map((read) =>
    read.status === "success" && typeof read.result === "bigint"
      ? read.result
      : undefined,
  )
  const finiteRatio = ratio !== undefined && ratio !== maxUint256
  const outOfRange =
    ratio !== undefined &&
    critical !== undefined &&
    upper !== undefined &&
    (ratio < critical || ratio > upper)
  const leverage =
    finiteRatio && ratio > WAD ? (ratio * WAD) / (ratio - WAD) : undefined
  const cushion =
    finiteRatio && ratio > 0n && critical !== undefined
      ? ratio > critical
        ? ((ratio - critical) * WAD) / ratio
        : 0n
      : undefined
  const stableShare =
    finiteRatio && ratio > 0n
      ? ratio > WAD
        ? (WAD * WAD) / ratio
        : WAD
      : undefined
  const reserveText =
    reserve !== undefined && baseDecimals !== undefined
      ? `${formatUnits(reserve, baseDecimals)} ${baseSymbol}`
      : "—"
  const explorer = getGluonNetwork(chainId)?.chain.blockExplorers?.default.url

  async function adjustPeg() {
    if (!account.address || !account.isConnected) {
      toast.error("Connect your wallet to adjust the peg.")
      return
    }
    if (account.chain?.id !== chainId || !client) {
      toast.error("Switch your wallet to this reactor’s network.")
      return
    }
    setConfirming(true)
    let txHash: `0x${string}` | undefined
    try {
      // Read again before asking the wallet; cached dashboard data may be outdated.
      const current = await client.readContract({
        address: reactorAddress as `0x${string}`,
        abi: StableCoinReactorABI,
        functionName: "reserveRatioPeggedAsset",
      })
      if (
        critical === undefined ||
        upper === undefined ||
        (current >= critical && current <= upper)
      ) {
        toast.info(
          "The reserve ratio is within bounds; no peg adjustment is needed.",
        )
        void refetch()
        return
      }
      const { request } = await client.simulateContract({
        address: reactorAddress as `0x${string}`,
        abi: StableCoinReactorABI,
        functionName: "adjustPeg",
        account: account.address,
        chain: client.chain,
      })
      if (
        latestAccount.current.address !== account.address ||
        latestAccount.current.chain?.id !== chainId
      ) {
        toast.error("Wallet or network changed. Please try again.")
        return
      }
      const hash = await writeContractAsync({ ...request, chainId })
      txHash = hash
      setSubmitted(hash)
      const receipt = await client.waitForTransactionReceipt({ hash })
      if (receipt.status !== "success") {
        toast.error("Peg adjustment reverted.")
        return
      }
      const adjusted =
        parseEventLogs({
          abi: StableCoinReactorABI,
          eventName: "PegAdjusted",
          logs: receipt.logs.filter(
            (log) => log.address.toLowerCase() === reactorAddress.toLowerCase(),
          ),
        }).length > 0
      if (adjusted)
        toast.success("Peg adjusted. Another adjustment may still be needed.")
      else
        toast.info(
          "The transaction confirmed without a peg change. Check the oracle price and reactor status.",
        )
      await Promise.allSettled([refetch(), onAdjusted()])
    } catch {
      toast.error(
        txHash
          ? "Transaction submitted, but confirmation is unavailable. Check the transaction link before retrying."
          : "Peg adjustment failed or was rejected. Check your wallet and reactor status.",
      )
    } finally {
      setConfirming(false)
    }
  }

  return (
    <section aria-label="Reactor dashboard" className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Reserve balance</p>
          <p className="mt-1 break-words text-sm font-semibold tabular-nums sm:text-lg">{reserveText}</p>
        </div>
        {outOfRange && (
          <Button size="sm" disabled={isPending || confirming} onClick={() => void adjustPeg()}>
            {isPending ? "Confirm in wallet…" : confirming ? "Adjusting…" : "Adjust peg"}
          </Button>
        )}
      </header>

      <div className="my-6 grid flex-1 items-center gap-6 sm:grid-cols-[10rem_minmax(0,1fr)] xl:grid-cols-[12rem_minmax(0,1fr)]">
        <div
          role="img"
          aria-label={stableShare === undefined ? "Reserve allocation unavailable" : "Approximate reserve split between stable claims and volatile surplus"}
          className="relative mx-auto size-40 shrink-0 rounded-full bg-muted xl:size-48"
          style={stableShare === undefined ? undefined : {
            background: `conic-gradient(var(--neutron) 0% ${formatUnits(stableShare * 100n, 18)}%, var(--proton) ${formatUnits(stableShare * 100n, 18)}% 100%)`,
          }}
        >
          <dl className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-card text-center xl:inset-4">
            <dt className="text-xs text-muted-foreground">Reserve ratio</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums xl:text-3xl">
              {ratio === undefined ? "—" : ratio === maxUint256 ? "∞" : formatPercentFromWad(ratio)}
            </dd>
          </dl>
        </div>
        <dl className="grid min-w-0 grid-cols-2 gap-3">
          {[
            ["Spot Proton leverage", leverage === undefined ? "—" : `${formatWad(leverage)}×`],
            ["Crash cushion", cushion === undefined ? "—" : formatPercentFromWad(cushion)],
            ["Peg factor", peg === undefined ? "—" : formatUnits(peg, 36)],
            ["Proton yield", "Historical data required"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-xl border border-border bg-background p-3 xl:p-4">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className={`mt-1 break-words tabular-nums ${label === "Proton yield" ? "text-xs leading-5 text-muted-foreground" : "text-base font-semibold"}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {stableShare !== undefined && (
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full bg-neutron" />Stable claims: {formatPercentFromWad(stableShare)}</span>
          <span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full bg-proton" />Volatile surplus: {formatPercentFromWad(WAD - stableShare)}</span>
        </div>
      )}
      {critical !== undefined && upper !== undefined && (
        <p className="mt-3 text-xs text-muted-foreground">Operating range: {formatPercentFromWad(critical)}–{formatPercentFromWad(upper)}</p>
      )}
      <details className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer underline underline-offset-4">About these metrics</summary>
        <p className="mt-2 leading-relaxed">
          Spot leverage is the current reserve-to-equity ratio for infinitesimal price changes.
          The crash cushion estimates the reserve price drop to the critical ratio, holding
          supply and peg fixed. Fees and peg changes affect both. A yield rate requires
          price history and is not estimated here.
        </p>
      </details>
      {submitted && explorer && (
        <a className="mt-3 inline-block text-xs underline" href={`${explorer}/tx/${submitted}`} target="_blank" rel="noopener noreferrer">
          View peg adjustment transaction
        </a>
      )}
    </section>
  )
}
