"use client"

import { formatUnits } from "viem"
import type {
  OraclePreflightResult,
  OraclePreflightStatus,
} from "@/utils/oraclePreflight"

interface OraclePreflightPanelProps {
  result: OraclePreflightResult | null
  isChecking: boolean
  error: string | null
  onCheck: () => void
}

type PanelStatus =
  | OraclePreflightStatus
  | "required"
  | "checking"
  | "unavailable"

function formatWad(value?: bigint) {
  if (value === undefined) return null

  const formatted = formatUnits(value, 18)
  const [whole, fraction = ""] = formatted.split(".")
  const significantFraction = fraction.replace(/0+$/, "")

  if (!significantFraction) return whole

  const visibleFraction = significantFraction.slice(0, 8)
  const trimmedVisibleFraction = visibleFraction.replace(/0+$/, "")

  if (!trimmedVisibleFraction) {
    return whole === "0" ? "< 0.00000001" : whole
  }

  return `${whole}.${trimmedVisibleFraction}`
}

function formatAge(seconds?: bigint) {
  if (seconds === undefined) return null

  const minute = BigInt(60)
  const hour = BigInt(3600)
  const day = BigInt(86400)

  if (seconds < minute) return `${seconds.toString()}s ago`
  if (seconds < hour) return `${(seconds / minute).toString()}m ago`

  if (seconds < day) {
    const hours = seconds / hour
    const minutes = (seconds % hour) / minute

    return minutes > BigInt(0)
      ? `${hours.toString()}h ${minutes.toString()}m ago`
      : `${hours.toString()}h ago`
  }

  const days = seconds / day
  const hours = (seconds % day) / hour

  return hours > BigInt(0)
    ? `${days.toString()}d ${hours.toString()}h ago`
    : `${days.toString()}d ago`
}

function StatusLabel({ status }: { status: PanelStatus }) {
  const styles: Record<PanelStatus, string> = {
    required: "text-white/45",
    checking: "text-white/60",
    compatible: "text-[#34D399]",
    warning: "text-[#FFE66D]",
    blocked: "text-[#FF7A7A]",
    unavailable: "text-[#FFE66D]",
  }

  const labels: Record<PanelStatus, string> = {
    required: "REQUIRED",
    checking: "CHECKING",
    compatible: "COMPATIBLE",
    warning: "REVIEW",
    blocked: "BLOCKED",
    unavailable: "UNAVAILABLE",
  }

  return (
    <span
      className={`font-mono text-[10px] font-semibold tracking-[0.22em] ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}

function DataRow({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  if (!value) return null

  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-white/35">
        {label}
      </span>
      <span className="text-right font-mono text-[12px] text-white/80">
        {value}
      </span>
    </div>
  )
}

export default function OraclePreflightPanel({
  result,
  isChecking,
  error,
  onCheck,
}: OraclePreflightPanelProps) {
  const status: PanelStatus = isChecking
    ? "checking"
    : error
      ? "unavailable"
      : result?.status ?? "required"

  if (!result && !isChecking && !error) {
    return (
      <div className="border border-white/15 bg-black/20">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[10px] uppercase tracking-[0.28em] text-white/55">
            Oracle Preflight
          </span>
          <StatusLabel status="required" />
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="mb-4 text-[11px] leading-5 text-white/45">
            Check that this oracle is compatible with Gluon before deploying the
            Reactor.
          </p>

          <button
            type="button"
            onClick={onCheck}
            className="border border-white/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/65 transition-colors hover:border-[#8FF7FF]/60 hover:text-[#8FF7FF]"
          >
            Run Preflight
          </button>
        </div>
      </div>
    )
  }

  if (isChecking) {
    return (
      <div className="border border-white/15 bg-black/20">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[10px] uppercase tracking-[0.28em] text-white/55">
            Oracle Preflight
          </span>
          <StatusLabel status="checking" />
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="font-mono text-[11px] text-white/45">
            Reading oracle contract...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-[#FFE66D]/25 bg-[#FFE66D]/[0.02]">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[10px] uppercase tracking-[0.28em] text-white/55">
            Oracle Preflight
          </span>
          <StatusLabel status="unavailable" />
        </div>

        <div className="border-t border-[#FFE66D]/15 px-4 py-4">
          <p className="text-[11px] leading-5 text-[#FFE66D]/75">{error}</p>

          <button
            type="button"
            onClick={onCheck}
            className="mt-4 border border-white/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-white/45 hover:text-white"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!result) return null

  const value = formatWad(result.value)
  const minValue = formatWad(result.minValue)
  const maxValue = formatWad(result.maxValue)
  const age = formatAge(result.ageSeconds)

  const range =
    minValue && maxValue ? `${minValue} – ${maxValue}` : null

  const allInterfaceReadsFailed =
    result.issues.length === 4 &&
    result.issues.every((issue) => issue.includes("could not be read"))

  const displayIssues = allInterfaceReadsFailed
    ? ["Contract does not implement the required Gluon IOracle interface."]
    : result.issues

  const borderClass =
    result.status === "blocked"
      ? "border-[#FF7A7A]/25"
      : result.status === "warning"
        ? "border-[#FFE66D]/25"
        : "border-[#34D399]/25"

  return (
    <div
      className={`border ${
        result.status === "compatible"
          ? "bg-[#34D399]/[0.025]"
          : "bg-black/20"
      } ${borderClass}`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/55">
          Oracle Preflight
        </span>
        <StatusLabel status={result.status} />
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        {result.description && (
          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
              Oracle
            </div>
            <div className="mt-1 text-sm font-semibold text-white/90">
              {result.description}
            </div>
          </div>
        )}

        {(value || range || age) && (
          <div className="divide-y divide-white/[0.07]">
            <DataRow label="Value" value={value} />
            <DataRow label="Range" value={range} />
            <DataRow label="Updated" value={age} />
          </div>
        )}

        {displayIssues.length > 0 && (
          <div className="border-l border-[#FF7A7A]/50 pl-3">
            {displayIssues.map((issue) => (
              <p
                key={issue}
                className="py-1 text-[11px] leading-5 text-[#FF9B9B]/85"
              >
                {issue}
              </p>
            ))}
          </div>
        )}

        {result.warnings.length > 0 && (
          <div className="border-l border-[#FFE66D]/40 pl-3">
            {result.warnings.map((warning) => (
              <p
                key={warning}
                className="py-1 text-[11px] leading-5 text-[#FFE66D]/75"
              >
                {warning}
              </p>
            ))}
          </div>
        )}

        {result.status === "compatible" && (
          <p className="mt-3 text-[11px] text-white/35">
            Compatible with the current Gluon IOracle interface.
          </p>
        )}

        {result.status === "blocked" && (
          <button
            type="button"
            onClick={onCheck}
            className="mt-4 border border-white/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-white/45 hover:text-white"
          >
            Check Again
          </button>
        )}
      </div>
    </div>
  )
}
