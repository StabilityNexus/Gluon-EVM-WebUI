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
    required: "text-muted-foreground/80",
    checking: "text-muted-foreground",
    compatible: "text-success",
    warning: "text-warning",
    blocked: "text-danger",
    unavailable: "text-warning",
  }

  const labels: Record<PanelStatus, string> = {
    required: "Required",
    checking: "Checking",
    compatible: "Compatible",
    warning: "Review",
    blocked: "Blocked",
    unavailable: "Unavailable",
  }

  return (
    <span
      className={`text-xs font-medium ${styles[status]}`}
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
      <span className="shrink-0 text-xs text-muted-foreground/70">
        {label}
      </span>
      <span className="text-right font-mono text-[13px] text-foreground/80">
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
      <div className="rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs text-muted-foreground">
            Oracle Preflight
          </span>
          <StatusLabel status="required" />
        </div>

        <div className="border-t border-border/60 px-4 py-4">
          <p className="mb-4 text-[13px] leading-5 text-muted-foreground/80">
            Check that this oracle is compatible with Gluon before deploying the
            Reactor.
          </p>

          <button
            type="button"
            onClick={onCheck}
            className="rounded-lg border border-border px-4 py-2 text-xs text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Run Preflight
          </button>
        </div>
      </div>
    )
  }

  if (isChecking) {
    return (
      <div className="rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs text-muted-foreground">
            Oracle Preflight
          </span>
          <StatusLabel status="checking" />
        </div>

        <div className="border-t border-border/60 px-4 py-4">
          <p className="font-mono text-xs text-muted-foreground/80">
            Reading oracle contract...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/[0.04]">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs text-muted-foreground">
            Oracle Preflight
          </span>
          <StatusLabel status="unavailable" />
        </div>

        <div className="border-t border-warning/15 px-4 py-4">
          <p className="text-[13px] leading-5 text-warning">{error}</p>

          <button
            type="button"
            onClick={onCheck}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
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
      ? "border-danger/25"
      : result.status === "warning"
        ? "border-warning/25"
        : "border-success/25"

  return (
    <div
      className={`rounded-xl border ${
        result.status === "compatible"
          ? "bg-success/[0.025]"
          : "bg-muted/25"
      } ${borderClass}`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-muted-foreground">
          Oracle Preflight
        </span>
        <StatusLabel status={result.status} />
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        {result.description && (
          <div className="mb-3">
            <div className="text-xs text-muted-foreground/60">
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
          <div className="border-l border-danger/50 pl-3">
            {displayIssues.map((issue) => (
              <p
                key={issue}
                className="py-1 text-[13px] leading-5 text-danger"
              >
                {issue}
              </p>
            ))}
          </div>
        )}

        {result.warnings.length > 0 && (
          <div className="border-l border-warning/40 pl-3">
            {result.warnings.map((warning) => (
              <p
                key={warning}
                className="py-1 text-[13px] leading-5 text-warning"
              >
                {warning}
              </p>
            ))}
          </div>
        )}

        {result.status === "compatible" && (
          <p className="mt-3 text-[13px] text-muted-foreground/70">
            Compatible with the current Gluon IOracle interface.
          </p>
        )}

        {result.status === "blocked" && (
          <button
            type="button"
            onClick={onCheck}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Check Again
          </button>
        )}
      </div>
    </div>
  )
}
