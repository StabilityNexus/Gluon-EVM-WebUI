"use client"

import { useState } from "react"
import Link from "next/link"
import { useReadContract, useChainId } from "wagmi"
import { Activity, AlertTriangle, ArrowRight, Rocket, Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/PageHeader"
import { TokenGlyph } from "@/components/home/TokenGlyph"
import { FactoryABI } from "@/utils/abi/Factory"
import { StableCoinReactorABI, ERC20ABI } from "@/utils/abi/StableCoin"
import { StableCoinFactories } from "@/utils/addresses"
import { GLUON_NETWORKS } from "@/utils/networks"

const shortAddress = (address: string) => `${address.slice(0, 8)}…${address.slice(-6)}`

function TokenRow({
  kind,
  label,
  symbol,
  name,
}: {
  kind: "neutron" | "proton"
  label: string
  symbol?: string
  name?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-3 text-sm">
      <dt className="flex shrink-0 items-center gap-2 text-muted-foreground">
        <TokenGlyph kind={kind} />
        {label}
      </dt>
      <dd className="flex min-w-0 items-center justify-end gap-2">
        {symbol || name ? (
          <>
            <span className="font-medium text-foreground">{symbol}</span>
            <span className="truncate text-muted-foreground">{name}</span>
          </>
        ) : (
          <Skeleton className="h-4 w-24" />
        )}
      </dd>
    </div>
  )
}

// Simple reactor card component
function SimpleReactorCard({ address, chainId }: { address: string; chainId: number }) {
  const explorer = GLUON_NETWORKS.find(({ chain }) => chain.id === chainId)?.chain.blockExplorers?.default.url
  const { data: reserveToken } = useReadContract({ address: address as `0x${string}`, abi: StableCoinReactorABI, functionName: "BASE_TOKEN", chainId })
  const { data: reserveSymbol } = useReadContract({ address: reserveToken, abi: ERC20ABI, functionName: "symbol", chainId, query: { enabled: !!reserveToken } })
  // Get vault name
  const { data: vaultName } = useReadContract({
    address: address as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: 'vaultName',
    chainId,
  })

  // Get neutron and proton token addresses directly from reactor
  const { data: neutronAddress } = useReadContract({
    address: address as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: 'NEUTRON_TOKEN',
    chainId,
  })

  const { data: protonAddress } = useReadContract({
    address: address as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: 'PROTON_TOKEN',
    chainId,
  })

  // Get neutron token details
  const { data: neutronName } = useReadContract({
    address: neutronAddress as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'name',
    chainId,
    query: {
      enabled: !!neutronAddress,
    }
  })

  const { data: neutronSymbol } = useReadContract({
    address: neutronAddress as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'symbol',
    chainId,
    query: {
      enabled: !!neutronAddress,
    }
  })

  // Get proton token details
  const { data: protonName } = useReadContract({
    address: protonAddress as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'name',
    chainId,
    query: {
      enabled: !!protonAddress,
    }
  })

  const { data: protonSymbol } = useReadContract({
    address: protonAddress as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'symbol',
    chainId,
    query: {
      enabled: !!protonAddress,
    }
  })

  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-line-strong hover:shadow-[var(--shadow-md)]">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <h2 className="truncate text-base font-semibold tracking-[-0.01em] text-foreground">
          {vaultName || `Vault ${address.slice(-6)}`}
        </h2>
        {explorer ? <a href={`${explorer}/address/${address}`} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0 rounded font-mono text-xs text-muted-foreground underline underline-offset-4" title={address}>{shortAddress(address)}</a> : <span className="ml-auto font-mono text-xs">{shortAddress(address)}</span>}
      </header>

      <dl className="mt-5 divide-y divide-border rounded-xl border border-border bg-background">
        <TokenRow kind="neutron" label="Stable Coin" symbol={neutronSymbol} name={neutronName} />
        <TokenRow kind="proton" label="Volatile Coin" symbol={protonSymbol} name={protonName} />
        <div className="flex flex-wrap justify-between gap-2 px-3.5 py-3 text-sm">
          <dt className="text-muted-foreground">Reserve Token</dt>
          <dd>{reserveToken && explorer ? <a href={`${explorer}/address/${reserveToken}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4" title={reserveToken}>{reserveSymbol || shortAddress(reserveToken)}</a> : "—"}</dd>
        </div>
      </dl>

      <Button asChild variant="outline" className="mt-5 w-full justify-between">
        <Link href={`/c?coin=${address}`}>
          Open reactor
          <ArrowRight aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </Button>
    </article>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-2 h-3.5 w-28" />
      <Skeleton className="mt-5 h-[5.5rem] w-full rounded-xl" />
      <Skeleton className="mt-5 h-10 w-full rounded-lg" />
    </div>
  )
}

export default function ExplorerPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const chainId = useChainId()

  const currentNetwork = GLUON_NETWORKS.find(({ chain }) => chain.id === chainId)
  const factoryAddress = StableCoinFactories[chainId as keyof typeof StableCoinFactories]
    ?? currentNetwork?.explorerFactoryAddress

  const historicalFactoryAddress =
    currentNetwork?.factoryAddress &&
    currentNetwork?.explorerFactoryAddress &&
    currentNetwork.factoryAddress.toLowerCase() !==
      currentNetwork.explorerFactoryAddress.toLowerCase()
      ? currentNetwork.explorerFactoryAddress
      : undefined

  // Read reactors registered in the current Factory.
  const {
    data: currentDeployedReactors,
    isLoading: isLoadingCurrentReactors,
    error: reactorsError,
    refetch: refetchReactors,
  } = useReadContract({
    address: factoryAddress,
    abi: FactoryABI,
    functionName: 'getAllDeployedReactors',
    chainId,
    query: { enabled: !!factoryAddress },
  })

  // Get reactor count for UI
  const {
    refetch: refetchCount,
  } = useReadContract({
    address: factoryAddress,
    abi: FactoryABI,
    functionName: 'getDeployedReactorsCount',
    chainId,
    query: { enabled: !!factoryAddress },
  })

  // Include older Sepolia test reactors without replacing the current registry.
  const {
    data: historicalReactors,
    isLoading: isLoadingHistoricalReactors,
    error: historicalReactorsError,
    refetch: refetchHistoricalReactors,
  } = useReadContract({
    address: historicalFactoryAddress,
    abi: FactoryABI,
    functionName: 'getAllDeployedReactors',
    chainId,
    query: { enabled: !!historicalFactoryAddress },
  })

  const deployedReactors = Array.from(
    new Map(
      [...(currentDeployedReactors ?? []), ...(historicalReactors ?? [])]
        .map((address) => [address.toLowerCase(), address] as const)
    ).values()
  )
  const isLoadingReactors = isLoadingCurrentReactors || isLoadingHistoricalReactors

  // Filter reactors by search term (basic filtering for addresses)
  const filteredReactorAddresses = deployedReactors?.filter((address: string) =>
    address.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Check if current chain is supported
  if (!factoryAddress) {
    return (
      <div className="container-page flex min-h-[calc(100vh-12rem)] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <AlertTriangle aria-hidden="true" className="mx-auto size-8 text-warning" />
          <h1 className="mt-4 text-lg font-semibold text-foreground">{currentNetwork ? "No deployment configured" : "Unsupported network"}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {currentNetwork
              ? `A Gluon factory has not yet been configured for ${currentNetwork.displayName}.`
              : `Chain ID ${chainId} is not supported. Switch your wallet to one of these networks:`}
          </p>
          <ul className="mt-5 divide-y divide-border rounded-xl border border-border bg-background text-left text-sm">
            {GLUON_NETWORKS.map(({ chain, displayName }) => (
              <li key={chain.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-foreground">{displayName}</span>
                <span className="font-mono text-xs text-muted-foreground">{chain.id}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  const currentRegistryFailed = !!reactorsError
  const historicalRegistryFailed = !!historicalReactorsError
  const hasError =
    currentRegistryFailed &&
    (!historicalFactoryAddress || historicalRegistryFailed)
  const hasPartialError =
    !hasError &&
    (currentRegistryFailed || historicalRegistryFailed)

  return (
    <div className="container-page min-h-[calc(100vh-12rem)] py-10 sm:py-14">
      <PageHeader
        title="Reactors"
        description="Browse deployed reactors and open them to use their stablecoins and volatile leveraged yield coins."
      />

      {currentNetwork?.explorerFactoryAddress && (
        <p role="status" className="mb-6 text-sm text-muted-foreground">
          Sepolia includes historical test reactors from an older Factory.
          New reactor creation uses the current verified Factory.
        </p>
      )}

      {hasPartialError && (
        <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <p>Some reactor registry data could not be loaded. Results may be incomplete.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (currentRegistryFailed) void refetchReactors()
              if (historicalRegistryFailed) void refetchHistoricalReactors()
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-danger/25 bg-danger/[0.04] px-6 py-8 text-center">
          <AlertTriangle aria-hidden="true" className="mx-auto size-7 text-danger" />
          <h2 className="mt-4 text-base font-semibold text-foreground">Unable to load reactors</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The reactor registry on {currentNetwork?.displayName || `chain ${chainId}`} could not be read.
            The network RPC may be temporarily unavailable or the factory unreachable.
          </p>
          <p className="mt-3 font-mono text-[11px] text-faint-foreground">
            Factory {shortAddress(factoryAddress)}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={() => {
              void refetchReactors()
              void refetchCount()
              if (historicalFactoryAddress) void refetchHistoricalReactors()
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoadingReactors && !hasError && (
        <div aria-busy="true" aria-label="Loading reactors">
          <Skeleton className="mx-auto mb-8 h-11 w-full max-w-xl rounded-lg" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}

      {!isLoadingReactors && !hasError && (
        <>
          {/* Search */}
          <div className="relative mx-auto mb-8 max-w-xl">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search reactors by address"
              placeholder="Search by reactor address"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10 pr-24"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted-foreground">
              {filteredReactorAddresses.length} {filteredReactorAddresses.length === 1 ? "reactor" : "reactors"}
            </span>
          </div>

          {/* Content */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredReactorAddresses.map((address) => (
                <SimpleReactorCard key={address} address={address} chainId={chainId} />
              ))}
            </div>
          ) : (
            <ul className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {filteredReactorAddresses.map((address) => (
                <li key={address}>
                  <Link
                    href={`/c?coin=${address}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 text-sm outline-none transition-colors duration-150 hover:bg-secondary focus-visible:bg-secondary"
                  >
                    <span className="flex items-center gap-4">
                      <span className="font-mono text-xs text-muted-foreground">{shortAddress(address)}</span>
                      <span className="font-medium text-foreground">Vault {address.slice(-6)}</span>
                    </span>
                    <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Empty State */}
          {filteredReactorAddresses.length === 0 && (
            <div className="mx-auto max-w-md py-16 text-center">
              <Activity aria-hidden="true" className="mx-auto size-8 text-faint-foreground" />
              <p className="mt-4 font-medium text-foreground">No reactors found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {deployedReactors.length === 0
                  ? hasPartialError
                    ? "No reactors could be displayed from the available registry data."
                    : "No reactors have been deployed on this network yet."
                  : "No reactor address matches your search."}
              </p>
              <div className="mt-6">
                {searchTerm ? (
                  <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                    Clear search
                  </Button>
                ) : !hasPartialError ? (
                  <Button asChild>
                    <Link href="/create">
                      <Rocket aria-hidden="true" />
                      Deploy the first reactor
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
