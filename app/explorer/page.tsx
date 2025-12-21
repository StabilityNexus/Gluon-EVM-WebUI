"use client"

import { useState, useEffect } from "react"
import { useReadContract, useChainId } from "wagmi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ExternalLink, Activity, Shield, AlertTriangle, Rocket } from "lucide-react"
import { StableCoinFactoryABI } from "@/utils/abi/StableCoinFactory"
import { StableCoinReactorABI, ERC20ABI } from "@/utils/abi/StableCoin"
import { StableCoinFactories } from "@/utils/addresses"
import Shuffle from "@/components/Shuffle"
import TargetCursor from "@/components/TargetCursor"
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
    <Card className="cursor-target bg-background/70 backdrop-blur-md border border-black/10 dark:border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.15)] hover:shadow-[0_0_30px_rgba(0,0,0,0.25)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] rounded-none">
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
              <div className="w-3 h-3 bg-yellow-500 rounded-none border border-yellow-400"></div>
              <span className="text-yellow-500 font-bold tracking-wider">{neutronSymbol || "NEUTRON"}</span>
            </div>
            <span className="text-muted-foreground font-bold">|</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-none border border-red-400"></div>
              <span className="text-red-500 font-bold tracking-wider">{protonSymbol || "PROTON"}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Token Names */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-muted-foreground">Neutron Token</span>
            </div>
            <span className="font-medium text-yellow-500">
              {neutronName || "Loading..."}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-muted-foreground">Proton Token</span>
            </div>
            <span className="font-medium text-red-500">
              {protonName || "Loading..."}
            </span>
          </div>
        </div>

        <Link href={`/c?coin=${address}`}>
          <Button className="w-full" size="sm">
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

  // Get all deployed reactors
  const { data: deployedReactors, isLoading: isLoadingReactors, error: reactorsError } = useReadContract({
    address: factoryAddress,
    abi: StableCoinFactoryABI,
    functionName: 'getAllDeployedReactors',
  })

  // Get reactor count for UI
  const { data: reactorCount, error: countError } = useReadContract({
    address: factoryAddress,
    abi: StableCoinFactoryABI,
    functionName: 'getDeployedReactorsCount',
  })

  // Debug logging
  useEffect(() => {
    console.log('Explorer Debug:', {
      chainId,
      factoryAddress,
      deployedReactors,
      reactorCount: reactorCount?.toString(),
      isLoadingReactors,
      reactorsError: reactorsError?.message,
      countError: countError?.message
    })
  }, [chainId, factoryAddress, deployedReactors, reactorCount, isLoadingReactors, reactorsError, countError])

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
            <div>• Citrea Testnet (Chain ID: 5115)</div>
            <div>• Rootstock Testnet (Chain ID: 31)</div>
            <div>• Scroll Sepolia (Chain ID: 534351)</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'Space Mono', 'Syne', 'Orbitron', 'Courier New', monospace", fontWeight: 500 }}
    >
      {/* Target Cursor Effect */}
      <TargetCursor
        spinDuration={2}
        hideDefaultCursor={true}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <Shuffle
            text="StableCoin Reactor Explorer"
            tag="h1"
            className="text-2xl sm:text-4xl lg:text-5xl mb-2"
            shuffleDirection="right"
            duration={0.35}
            animationMode="evenodd"
            shuffleTimes={1}
            ease="power3.out"
            stagger={0.03}
            threshold={0.1}
            triggerOnce={true}
            triggerOnHover={true}
            respectReducedMotion={true}
          />
        </div>

        {/* Error State */}
        {(reactorsError || countError) && (
          <div className="text-center py-16">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4 opacity-50" />
            <p className="text-red-400 mb-2">Failed to connect to factory contract</p>
            <p className="text-sm text-red-300 font-mono mb-4">
              Factory: {StableCoinFactories[534351]}
            </p>
            <p className="text-xs text-red-300">
              {reactorsError?.message || countError?.message}
            </p>
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
        {!isLoadingReactors && (
          <>
            <div className="mb-8 max-w-4xl mx-auto">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by reactor address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-transparent border-2 border-white/20 focus:border-white/40 hover:border-white/30 rounded-full transition-all duration-300 shadow-sm focus:shadow-md cursor-target"
                />
              </div>
            </div>

            {/* Content */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {filteredReactorAddresses.map((address) => (
                  <SimpleReactorCard key={address} address={address} />
                ))}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-2">
                {filteredReactorAddresses.map((address) => (
                  <Link key={address} href={`/c?coin=${address}`}>
                    <div className="bg-black/70 backdrop-blur-md border-big-dashed group cursor-target shadow-lg hover:shadow-xl rounded-none p-4">
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
            {filteredReactorAddresses.length === 0 && !isLoadingReactors && (
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
