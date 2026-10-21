import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { shortenAddress } from "../interactionUtils"
import type { InteractionModel } from "../hooks/useReactorInteraction"

type InteractionHeaderProps = {
  model: Pick<InteractionModel, "vaultHeading" | "reactorAddress">
}

export function InteractionHeader({ model }: InteractionHeaderProps) {
  const { vaultHeading, reactorAddress } = model

  return (
    <div className="min-w-0">
      <Link
        href="/explorer"
        className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reactors
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{vaultHeading}</h1>
        <span className="rounded border border-border px-2 py-1 font-mono text-xs text-muted-foreground" title={reactorAddress}>{shortenAddress(reactorAddress)}</span>
      </div>
    </div>
  )
}
