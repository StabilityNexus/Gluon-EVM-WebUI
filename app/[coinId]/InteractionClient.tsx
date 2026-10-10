"use client"

import { useSearchParams } from "next/navigation"
import { useReactorInteraction } from "./hooks/useReactorInteraction"
import { InteractionHeader } from "./components/InteractionHeader"
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container-page py-10 sm:py-14">
        <InteractionHeader model={interaction} />
        <div className="mx-auto max-w-2xl">
          <SwapForm model={interaction} />
        </div>
        <ReactorParameters infoSections={interaction.infoSections} />
      </div>
    </div>
  )
}
