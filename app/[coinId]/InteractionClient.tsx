"use client"

import { useSearchParams } from "next/navigation"
import { useReactorInteraction } from "./hooks/useReactorInteraction"
import { InteractionHeader } from "./components/InteractionHeader"
import { ReactorDashboard } from "./components/ReactorDashboard"
import { SwapForm } from "./components/SwapForm"
import { ReactorParameters } from "./components/ReactorParameters"
import { MissingReactorAddress } from "./components/MissingReactorAddress"

export default function InteractionClient({ coinId }: { coinId: string }) {
  const searchParams = useSearchParams()
  const reactorAddress = coinId === "c" ? searchParams.get("coin") : coinId

  if (!reactorAddress) {
    return <MissingReactorAddress />
  }

  return <ReactorInteractionClient reactorAddress={reactorAddress} />
}

function ReactorInteractionClient({
  reactorAddress,
}: {
  reactorAddress: string
}) {
  const interaction = useReactorInteraction(reactorAddress)

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-[112rem] px-4 py-6 sm:px-6 lg:px-8">
        <InteractionHeader model={interaction} />
        <div className="grid items-stretch gap-6 xl:grid-cols-2">
          <ReactorDashboard key={`${interaction.chainId}:${reactorAddress}`} onAdjusted={interaction.refreshPricing} reactorAddress={reactorAddress} chainId={interaction.chainId} baseDecimals={interaction.baseDecimalsNumber} baseSymbol={interaction.baseSymbolText} />
          <div className="min-w-0 xl:h-full">
            <SwapForm model={interaction} />
          </div>
        </div>
        <ReactorParameters infoSections={interaction.infoSections} />
      </div>
    </div>
  )
}
