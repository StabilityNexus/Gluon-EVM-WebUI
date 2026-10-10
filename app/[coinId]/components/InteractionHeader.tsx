import Link from "next/link"
import { PageHeader } from "@/components/PageHeader"
import { ArrowLeft } from "lucide-react"
import { shortenAddress } from "../interactionUtils"
import type { InteractionModel } from "../hooks/useReactorInteraction"

type InteractionHeaderProps = {
  model: Pick<InteractionModel, "vaultHeading" | "reactorAddress">
}

export function InteractionHeader({ model }: InteractionHeaderProps) {
  const { vaultHeading, reactorAddress } = model

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/explorer"
        className="mb-8 inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to reactors
      </Link>

      <PageHeader
        title={vaultHeading}
        description="Convert assets through this reactor and inspect its live reserve, pricing, fee, and contract configuration."
        meta={
          <span className="rounded-md border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
            {shortenAddress(reactorAddress)}
          </span>
        }
      />
    </div>
  )
}
