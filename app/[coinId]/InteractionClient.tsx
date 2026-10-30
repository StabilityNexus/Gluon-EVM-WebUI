"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { isAddress } from "viem"
import { useChainId, useReadContract } from "wagmi"
import { FactoryABI } from "@/utils/abi/Factory"
import { StableCoinFactories } from "@/utils/addresses"
import { getGluonNetwork } from "@/utils/networks"
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

  return <VerifiedReactorAccess reactorAddress={reactorAddress} />
}

function VerifiedReactorAccess({ reactorAddress }: { reactorAddress: string }) {
  const chainId = useChainId()
  const isValidAddress = isAddress(reactorAddress)
  const network = getGluonNetwork(chainId)
  const currentFactoryAddress = StableCoinFactories[chainId]

  // Preserve historical-only fallback and check both trusted registries
  // when the current and historical Factories are different.
  const factoryAddress =
    currentFactoryAddress ?? network?.explorerFactoryAddress

  const historicalFactoryAddress =
    currentFactoryAddress &&
    network?.explorerFactoryAddress &&
    currentFactoryAddress.toLowerCase() !==
      network.explorerFactoryAddress.toLowerCase()
      ? network.explorerFactoryAddress
      : undefined

  const readCurrent = isValidAddress && !!factoryAddress
  const readHistorical = isValidAddress && !!historicalFactoryAddress

  const {
    data: currentReactors,
    isPending: currentPending,
    isError: currentError,
    isSuccess: currentSuccess,
  } = useReadContract({
    address: factoryAddress,
    abi: FactoryABI,
    functionName: "getAllDeployedReactors",
    chainId,
    query: { enabled: readCurrent },
  })

  const {
    data: historicalReactors,
    isPending: historicalPending,
    isError: historicalError,
    isSuccess: historicalSuccess,
  } = useReadContract({
    address: historicalFactoryAddress,
    abi: FactoryABI,
    functionName: "getAllDeployedReactors",
    chainId,
    query: { enabled: readHistorical },
  })

  if (!isValidAddress) {
    return <ReactorAccessMessage title="Invalid reactor address" />
  }

  if (!factoryAddress) {
    return <ReactorAccessMessage title="No reactor factory configured for this network" />
  }

  const normalizedAddress = reactorAddress.toLowerCase()

  // Never trust failed or pending reads, even if cached data exists.
  const verifiedCurrent =
    readCurrent &&
    currentSuccess &&
    !currentError &&
    currentReactors?.some(
      (address) => address.toLowerCase() === normalizedAddress,
    )

  const verifiedHistorical =
    readHistorical &&
    historicalSuccess &&
    !historicalError &&
    historicalReactors?.some(
      (address) => address.toLowerCase() === normalizedAddress,
    )

  if (verifiedCurrent || verifiedHistorical) {
    return <ReactorInteractionClient reactorAddress={reactorAddress} />
  }

  if (
    (readCurrent && currentPending) ||
    (readHistorical && historicalPending)
  ) {
    return <ReactorAccessMessage title="Verifying reactor" role="status" />
  }

  // Fail closed: neither trusted registry verified this address.
  return (
    <ReactorAccessMessage
      title="Reactor not verified"
      description="This address could not be verified against this network's trusted Gluon factory registries. Approvals and transactions are disabled."
    />
  )
}

function ReactorAccessMessage({
  title,
  description,
  role = "alert",
}: {
  title: string
  description?: string
  role?: "alert" | "status"
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-lg text-center" role={role}>
        <h2 className="mb-2 text-2xl font-semibold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
        <Link href="/explorer" className="mt-4 inline-block underline">
          Back to reactors
        </Link>
      </div>
    </div>
  )
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
