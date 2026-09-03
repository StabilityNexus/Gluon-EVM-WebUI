"use client"

import { useState } from "react"
import { useReadContract, useChainId } from "wagmi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ExternalLink, Activity, Shield, AlertTriangle, Rocket } from "lucide-react"
import { StableCoinFactoryABI } from "@/utils/abi/StableCoinFactory"
import { StableCoinReactorABI, ERC20ABI } from "@/utils/abi/StableCoin"
import { StableCoinFactories } from "@/utils/addresses"
import { GLUON_NETWORKS } from "@/utils/networks"
import Shuffle from "@/components/Shuffle"
import Link from "next/link"

// Simple reactor card component
function SimpleReactorCard({ address }: { address: string }) {
  // Get vault name
  const { data: vaultName } = useReadContract({
    address: address as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: 'vaultName',
  })

  // Get neutron and proton token addresses directly from reactor
  const { data: neutronAddress } = useReadContract({
    address: address as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: 'NEUTRON_TOKEN',
  })

  const { data: protonAddress } = useReadContract({
    address: address as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: 'PROTON_TOKEN',
  })

  // Get neutron token details
  const { data: neutronName } = useReadContract({
    address: neutronAddress as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'name',
    query: {
      enabled: !!neutronAddress,
    }
  })

  const { data: neutronSymbol } = useReadContract({
    address: neutronAddress as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'symbol',
    query: {
      enabled: !!neutronAddress,
    }
  })

  // Get proton token details
  const { data: protonName } = useReadContract({
    address: protonAddress as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'name',
    query: {
      enabled: !!protonAddress,
    }
  })

  const { data: protonSymbol } = useReadContract({
    address: protonAddress as `0x${string}`,
    abi: ERC20ABI,
    functionName: 'symbol',
    query: {
      enabled: !!protonAddress,
    }
  })

  return (
    <Card className="group bg-card/55 dark:bg-black/55 backdrop-blur-sm border-big-dashed shadow-sm hover:shadow-xl rounded-xl overflow-hidden transition-[transform,box-shadow,border-color,background-color] duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-bold tracking-wide">
                {vaultName || `Vault ${address.slice(-6)}`}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {address.slice(0, 8)}...{address.slice(-6)}
              </p>
            </div>
          </div>

          {/* Token Pair */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 dark:bg-yellow-500 rounded-none border border-amber-400 dark:border-yellow-400"></div>
              <span className="text-amber-600 dark:text-yellow-500 font-bold tracking-wider">{neutronSymbol || "NEUTRON"}</span>
            </div>
            <span className="text-muted-foreground font-bold">|</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-none border border-red-400"></div>
              <span className="text-red-600 dark:text-red-500 font-bold tracking-wider">{protonSymbol || "PROTON"}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Token Names */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 dark:bg-yellow-500 rounded-full"></div>
              <span className="text-muted-foreground">Neutron Token</span>
            </div>
            <span className="font-medium text-amber-600 dark:text-yellow-500">
              {neutronName || "Loading..."}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-muted-foreground">Proton Token</span>
            </div>
            <span className="font-medium text-red-600 dark:text-red-500">
              {protonName || "Loading..."}
            </span>
          </div>
        </div>

        <Link href={`/c?coin=${address}`}>
          <Button className="cursor-target-force w-full h-11 rounded-lg font-medium transition-transform duration-200 active:scale-[0.99]" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Interact
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default function ExplorerPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const chainId = useChainId()

  // Get current chain's factory address
  const factoryAddress = StableCoinFactories[chainId as keyof typeof StableCoinFactories]

  const currentNetwork = GLUON_NETWORKS.find(
    ({ chain }) => chain.id === chainId
  )

  // Get all deployed reactors
  const {
    data: deployedReactors,
    isLoading: isLoadingReactors,
    error: reactorsError,
    refetch: refetchReactors,
  } = useReadContract({
    address: factoryAddress,
    abi: StableCoinFactoryABI,
    functionName: 'getAllDeployedReactors',
  })

  // Get reactor count for UI
  const {
    error: countError,
    refetch: refetchCount,
  } = useReadContract({
    address: factoryAddress,
    abi: StableCoinFactoryABI,
    functionName: 'getDeployedReactorsCount',
  })

  // Filter reactors by search term (basic filtering for addresses)
  const filteredReactorAddresses = deployedReactors?.filter((address: string) =>
    address.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Check if current chain is supported
  if (!factoryAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
          <h2 className="text-2xl font-bold">Unsupported Chain</h2>
          <p className="text-muted-foreground max-w-md">
            Chain ID {chainId} is not supported. Please switch to one of the supported networks:
          </p>
          <div className="space-y-2 text-sm">
            {GLUON_NETWORKS.map(({ chain, displayName }) => (
              <div key={chain.id}>
                • {displayName} (Chain ID: {chain.id})
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-12rem)]">
      <div className="container mx-auto px-0 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-10 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Protocol Registry
          </p>

          <Shuffle
            text="StableCoin Reactor Explorer"
            tag="h1"
            className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em]"
            shuffleDirection="right"
            duration={0.35}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.025}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover={true}
            respectReducedMotion={true}
          />

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Browse deployed reactors and open one to inspect its live state
            or interact with its token pair.
          </p>
        </header>

        {/* Error State */}
        {(reactorsError || countError) && (
          <div className="mx-auto my-10 max-w-2xl rounded-xl border border-red-500/20 bg-red-500/[0.04] px-6 py-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500/80" />

            <h2 className="mt-4 text-base font-semibold text-foreground">
              Unable to load reactors
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              We couldn&apos;t read the reactor registry on{" "}
              {currentNetwork?.displayName || `chain ${chainId}`}.
              This can happen when the network RPC is temporarily unavailable
              or the configured factory cannot be reached.
            </p>

            <p className="mt-3 font-mono text-[10px] text-muted-foreground/70">
              Factory {factoryAddress.slice(0, 8)}…{factoryAddress.slice(-6)}
            </p>

            <Button
              variant="outline"
              size="sm"
              className="mt-5 rounded-lg"
              onClick={() => {
                void refetchReactors()
                void refetchCount()
              }}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoadingReactors && !reactorsError && !countError && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading reactors...</p>
          </div>
        )}

        {/* Search and Filters */}
        {!isLoadingReactors && !reactorsError && !countError && (
          <>
            <div className="mb-8 mx-auto max-w-4xl">
              <div className="rounded-2xl border border-border bg-card/30 p-3 sm:p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    placeholder="Search by reactor address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 rounded-full border-border bg-background/80 pl-11 pr-28 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-foreground/20 focus:border-foreground/35 focus:shadow-md"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {filteredReactorAddresses.length}{" "}
                    {filteredReactorAddresses.length === 1 ? "vault" : "vaults"}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {filteredReactorAddresses.map((address) => (
                  <SimpleReactorCard key={address} address={address} />
                ))}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-2">
                {filteredReactorAddresses.map((address) => (
                  <Link key={address} href={`/c?coin=${address}`}>
                    <div className="bg-background/95 dark:bg-black/70 backdrop-blur-md border-big-dashed group shadow-lg hover:shadow-xl rounded-none p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="font-mono text-sm text-muted-foreground">
                            {address.slice(0, 8)}...{address.slice(-6)}
                          </div>
                          <div className="text-sm font-medium group-hover:text-primary transition-colors">
                            Vault {address.slice(-6)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                          <ExternalLink className="h-3 w-3" />
                          Interact
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredReactorAddresses.length === 0 && !isLoadingReactors && !reactorsError && !countError && (
              <div className="text-center py-16">
                <div className="mb-4">
                  <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-2">No reactors found</p>
                  <p className="text-sm text-muted-foreground">
                    {deployedReactors && deployedReactors.length === 0
                      ? "No reactors have been deployed yet."
                      : "Try adjusting your search criteria."
                    }
                  </p>
                </div>
                {searchTerm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear search
                  </Button>
                ) : (
                  <Link href="/create">
                    <Button>
                      <Rocket className="h-4 w-4 mr-2" />
                      Deploy First Reactor
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
