"use client"

import { useEffect, useRef, useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useDeployContract, usePublicClient } from "wagmi"
import { parseUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, CheckCircle, Zap } from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { StableCoinFactoryABI } from "@/utils/abi/StableCoinFactory"
import {
  ChainlinkToOracleAdapterABI,
  ChainlinkToOracleAdapterBytecode,
} from "@/utils/abi/ChainlinkToOracleAdapter"
import { StableCoinFactories } from "@/utils/addresses"
import { GLUON_NETWORKS } from "@/utils/networks"
import { Toaster, toast } from "sonner"
import Shuffle from "@/components/Shuffle"
import TargetCursor from "@/components/TargetCursor"
import TokenSelector from "@/components/TokenSelector"

interface ReactorConfig {
  vaultName: string
  baseAssetName: string
  baseAssetSymbol: string
  peggedAssetName: string
  peggedAssetSymbol: string
  protonName: string  
  protonSymbol: string
  baseToken: string
  oracleAddress: string
  treasury: string
  criticalReserveRatio: string
}

type OracleProvider = "existing" | "chainlink"

const CHAINLINK_SUPPORTED_CHAIN_IDS = new Set<number>([11155111])

const ChainlinkFeedABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { type: "uint80" },
      { type: "int256" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

export default function CreatePage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { deployContractAsync, isPending: isAdapterDeploying } = useDeployContract()
  const [config, setConfig] = useState<ReactorConfig>({
    vaultName: "",
    baseAssetName: "",
    baseAssetSymbol: "",
    peggedAssetName: "",
    peggedAssetSymbol: "",
    protonName: "",
    protonSymbol: "",
    baseToken: "",
    oracleAddress: "",
    treasury: address || "",
    criticalReserveRatio: "400",
  })

  const [oracleProvider, setOracleProvider] = useState<OracleProvider>("existing")
  const [chainlinkFeed, setChainlinkFeed] = useState("")
  const [isAdapterConfirming, setIsAdapterConfirming] = useState(false)
  const latestChainIdRef = useRef(chainId)
  const adapterDeploymentInProgressRef = useRef(false)
  const isChainlinkSupported = CHAINLINK_SUPPORTED_CHAIN_IDS.has(chainId)
  const isAdapterDeploymentBusy = isAdapterDeploying || isAdapterConfirming

  // Contract interaction
  const { data: hash, isPending: isDeploying, writeContractAsync } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const updateConfig = (field: keyof ReactorConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const [hasSetDefaultTreasury, setHasSetDefaultTreasury] = useState(false)

  useEffect(() => {
    latestChainIdRef.current = chainId
    setChainlinkFeed("")
    setConfig((prev) => ({ ...prev, oracleAddress: "" }))

    if (!CHAINLINK_SUPPORTED_CHAIN_IDS.has(chainId)) {
      setOracleProvider("existing")
    }
  }, [chainId])

  useEffect(() => {
    if (isConnected && address && config.treasury === "" && !hasSetDefaultTreasury) {
      setConfig((prev) => ({ ...prev, treasury: address }))
      setHasSetDefaultTreasury(true)
    }
  }, [isConnected, address, config.treasury, hasSetDefaultTreasury])

  const isFormValid = () => {
    return config.vaultName &&
           config.baseAssetName &&
           config.baseAssetSymbol &&
           config.peggedAssetName && 
           config.peggedAssetSymbol && 
           config.protonName && 
           config.protonSymbol && 
           config.baseToken && 
           config.oracleAddress &&
           config.treasury &&
           config.criticalReserveRatio
  }

  const handleDeployChainlinkAdapter = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!publicClient) {
      toast.error("Network client is not available")
      return
    }

    if (!isChainlinkSupported) {
      toast.error("Chainlink is not supported on this network")
      return
    }

    const factoryAddress = StableCoinFactories[chainId as keyof typeof StableCoinFactories]
    if (!factoryAddress) {
      toast.error("Current chain is not supported")
      return
    }

    const feedAddress = chainlinkFeed.trim()
    if (!/^0x[0-9a-fA-F]{40}$/.test(feedAddress)) {
      toast.error("Chainlink feed must be a valid 20-byte address")
      return
    }

    if (adapterDeploymentInProgressRef.current) {
      return
    }

    const deploymentChainId = chainId
    adapterDeploymentInProgressRef.current = true
    setIsAdapterConfirming(true)

    try {
      try {
        // decimals() also confirms that the address exposes the expected feed interface.
        const [, roundData] = await Promise.all([
          publicClient.readContract({
            address: feedAddress as `0x${string}`,
            abi: ChainlinkFeedABI,
            functionName: "decimals",
          }),
          publicClient.readContract({
            address: feedAddress as `0x${string}`,
            abi: ChainlinkFeedABI,
            functionName: "latestRoundData",
          }),
        ])

        if (roundData[1] <= BigInt(0)) {
          toast.error("Chainlink feed returned an invalid price")
          return
        }
      } catch (error) {
        console.error("Chainlink feed validation error:", error)
        toast.error("Unable to validate Chainlink feed. Check the address or network connection.")
        return
      }

      if (latestChainIdRef.current !== deploymentChainId) {
        toast.error("Network changed during deployment. Please try again.")
        return
      }

      const hash = await deployContractAsync({
        abi: ChainlinkToOracleAdapterABI,
        bytecode: ChainlinkToOracleAdapterBytecode,
        args: [feedAddress as `0x${string}`],
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      if (latestChainIdRef.current !== deploymentChainId) {
        toast.error("Network changed during deployment. The adapter was not applied.")
        return
      }

      if (receipt.status !== "success") {
        toast.error("Adapter deployment transaction reverted")
        return
      }

      if (!receipt.contractAddress) {
        toast.error("Adapter deployment did not return an address")
        return
      }

      updateConfig("oracleAddress", receipt.contractAddress)
      toast.success("Chainlink adapter deployed")
    } catch (error) {
      console.error("Chainlink adapter deployment error:", error)
      toast.error("Failed to deploy Chainlink adapter")
    } finally {
      adapterDeploymentInProgressRef.current = false
      setIsAdapterConfirming(false)
    }
  }

  const handleDeploy = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!writeContractAsync) {
      toast.error("Contract write function not available")
      return
    }

    if (!isFormValid()) {
      toast.error("Please fill in all required fields")
      return
    }

    const factoryAddress = StableCoinFactories[chainId as keyof typeof StableCoinFactories]

    if (!factoryAddress) {
      toast.error(`Chain ID ${chainId} is not supported. Please switch to ${GLUON_NETWORKS.map(({ displayName }) => displayName).join(", ")}.`)
      return
    }

    const vaultName = config.vaultName.trim()
    if (!vaultName) {
      toast.error("Vault name cannot be empty")
      return
    }

    const baseAssetName = config.baseAssetName.trim()
    if (!baseAssetName) {
      toast.error("Base asset name cannot be empty")
      return
    }

    const baseAssetSymbol = config.baseAssetSymbol.trim()
    if (!baseAssetSymbol) {
      toast.error("Base asset symbol cannot be empty")
      return
    }

    const peggedAssetName = config.peggedAssetName.trim()
    if (!peggedAssetName) {
      toast.error("Stable token name cannot be empty")
      return
    }

    const peggedAssetSymbol = config.peggedAssetSymbol.trim()
    if (!peggedAssetSymbol) {
      toast.error("Stable token symbol cannot be empty")
      return
    }

    const protonName = config.protonName.trim()
    if (!protonName) {
      toast.error("Proton token name cannot be empty")
      return
    }

    const protonSymbol = config.protonSymbol.trim()
    if (!protonSymbol) {
      toast.error("Proton token symbol cannot be empty")
      return
    }

    const baseToken = config.baseToken.trim()
    if (!/^0x[0-9a-fA-F]{40}$/.test(baseToken)) {
      toast.error("Base token must be a 20-byte checksum address")
      return
    }

    const oracleAddress = config.oracleAddress.trim()
    if (!/^0x[0-9a-fA-F]{40}$/.test(oracleAddress)) {
      toast.error("Oracle address must be a 20-byte checksum address")
      return
    }

    const treasuryAddress = config.treasury.trim()
    if (!/^0x[0-9a-fA-F]{40}$/.test(treasuryAddress)) {
      toast.error("Treasury address must be a 20-byte checksum address")
      return
    }

    const ratioValue = Number(config.criticalReserveRatio)
    if (Number.isNaN(ratioValue) || ratioValue < 100) {
      toast.error("Critical reserve ratio must be at least 100%")
      return
    }

    const criticalReserveRatioWad = parseUnits((ratioValue / 100).toString(), 18)
    if (criticalReserveRatioWad < parseUnits("1", 18)) {
      toast.error("Critical reserve ratio must be at least 100%")
      return
    }

    const account = address as `0x${string}`

    try {
      await writeContractAsync({
        account,
        address: factoryAddress,
        abi: StableCoinFactoryABI,
        functionName: 'deployReactor',
        args: [
          vaultName,
          baseAssetName,
          baseAssetSymbol,
          peggedAssetName,
          peggedAssetSymbol,
          baseToken as `0x${string}`,
          oracleAddress as `0x${string}`,
          protonName,
          protonSymbol,
          treasuryAddress as `0x${string}`,
          BigInt(5000000000000000), // 0.5% fission fee (0.005e18)
          BigInt(5000000000000000), // 0.5% fusion fee (0.005e18)
          criticalReserveRatioWad
        ]
      })
    } catch (error) {
      console.error("Deployment error:", error)
      toast.error("Failed to deploy reactor")
    }
  }

  const fieldBaseClasses =
    "bg-[#0B0E15] border border-white/30 text-[13px] font-semibold tracking-[0.2em] text-white/85 placeholder:text-white/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70 focus:border-white/60 transition-colors duration-200 px-4 rounded-none font-mono cursor-text"
  const inputClasses = `${fieldBaseClasses} h-12`

  return (
    <div
      className="min-h-screen bg-[#050608] text-white"
      style={{ fontFamily: "'Space Mono', 'Syne', 'Orbitron', 'Courier New', monospace", fontWeight: "500" }}
    >
      <Toaster position="bottom-right" richColors />

      {/* Target Cursor Effect */}
      <TargetCursor 
        spinDuration={2}
        hideDefaultCursor={false}
        ignoreSelector=".cursor-normal, input, textarea, select, button, .cursor-text, [role='combobox']"
      />

      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative overflow-hidden border border-white/25 bg-[#090B11]/85 shadow-[0_0_60px_rgba(0,0,0,0.65)] backdrop-blur-sm cursor-normal">
            <div className="flex items-center justify-between border-b border-white/20 bg-[#050608]/80 px-8 py-6 uppercase tracking-[0.3em] text-xs text-white/60">
              <div className="flex items-center gap-4 text-white">
                <span className="text-sm font-bold text-[#8FF7FF]">//</span>
                <Shuffle
                  text="Create Your Reactor"
                  tag="span"
                  className="text-sm font-semibold"
                  shuffleDirection="right"
                  duration={0.3}
                  animationMode="random"
                  shuffleTimes={1}
                  ease="power3.out"
                  stagger={0.02}
                  threshold={0.1}
                  triggerOnce
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-10 rounded-full border border-white/15 bg-white/10" />
                <span className="h-2 w-4 rounded-full border border-white/15 bg-white/5" />
              </div>
            </div>

            <div className="grid gap-10 px-8 py-10">

              {!isConnected && (
                <div className="flex items-center gap-3 border border-dashed border-white/30 bg-black/30 px-5 py-4 text-white/60">
                  <Wallet className="h-5 w-5" />
                  <span className="tracking-[0.2em] uppercase text-[11px]">
                    Connect your wallet to authorize deployment
                  </span>
                </div>
              )}

              <div className="grid gap-8">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                    Vault Name
                  </Label>
                  <Input
                    placeholder="Gold Backed Vault"
                    value={config.vaultName}
                    onChange={(e) => updateConfig("vaultName", e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                      Base Asset Name
                    </Label>
                    <Input
                      placeholder="Bitcoin Reserve"
                      value={config.baseAssetName}
                      onChange={(e) => updateConfig("baseAssetName", e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                      Base Asset Symbol
                    </Label>
                    <Input
                      placeholder="BTC"
                      value={config.baseAssetSymbol}
                      onChange={(e) => updateConfig("baseAssetSymbol", e.target.value.toUpperCase())}
                      className={`${inputClasses} font-mono`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                    Base Token (Collateral)
                  </Label>
                  <TokenSelector
                    value={config.baseToken}
                    onChange={(address) => updateConfig("baseToken", address)}
                    placeholder="0x..."
                    label=""
                    required={true}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                    Oracle Provider
                  </Label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      aria-pressed={oracleProvider === "existing"}
                      disabled={isAdapterDeploymentBusy}
                      onClick={() => {
                        if (oracleProvider !== "existing") {
                          updateConfig("oracleAddress", "")
                        }
                        setOracleProvider("existing")
                      }}
                      className={`h-12 border text-[11px] uppercase tracking-[0.25em] transition-colors ${
                        oracleProvider === "existing"
                          ? "border-[#8FF7FF] bg-[#8FF7FF]/10 text-[#8FF7FF]"
                          : "border-white/25 bg-[#0B0E15] text-white/60 hover:border-white/50"
                      }`}
                    >
                      Existing Adapter
                    </button>

                    <button
                      type="button"
                      aria-pressed={oracleProvider === "chainlink"}
                      disabled={!isChainlinkSupported || isAdapterDeploymentBusy}
                      onClick={() => {
                        if (oracleProvider !== "chainlink") {
                          updateConfig("oracleAddress", "")
                        }
                        setOracleProvider("chainlink")
                      }}
                      className={`h-12 border text-[11px] uppercase tracking-[0.25em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        oracleProvider === "chainlink"
                          ? "border-[#8FF7FF] bg-[#8FF7FF]/10 text-[#8FF7FF]"
                          : "border-white/25 bg-[#0B0E15] text-white/60 hover:border-white/50"
                      }`}
                    >
                      Chainlink
                    </button>
                  </div>

                  {!isChainlinkSupported && (
                    <p className="text-[11px] text-white/45">
                      Chainlink feeds are not configured for this network.
                    </p>
                  )}

                  {oracleProvider === "existing" ? (
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                        Oracle Adapter Address
                      </Label>
                      <Input
                        placeholder="0x..."
                        value={config.oracleAddress}
                        onChange={(e) => updateConfig("oracleAddress", e.target.value)}
                        className={`${inputClasses} font-mono`}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                        Chainlink Feed Address
                      </Label>
                      <Input
                        placeholder="0x..."
                        disabled={isAdapterDeploymentBusy}
                        value={chainlinkFeed}
                        onChange={(e) => {
                          setChainlinkFeed(e.target.value)
                          updateConfig("oracleAddress", "")
                        }}
                        className={`${inputClasses} font-mono`}
                      />

                      <button
                        type="button"
                        onClick={handleDeployChainlinkAdapter}
                        disabled={isAdapterDeploymentBusy}
                        className="h-12 w-full border border-white/30 bg-white/5 text-[11px] uppercase tracking-[0.25em] text-white/80 transition-colors hover:border-[#8FF7FF] hover:text-[#8FF7FF] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAdapterDeploymentBusy
                          ? "Deploying Adapter..."
                          : "Deploy Chainlink Adapter"}
                      </button>

                      {config.oracleAddress && (
                        <p className="break-all font-mono text-[11px] text-[#8FF7FF]">
                          Adapter: {config.oracleAddress}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                      Critical Reserve Ratio (%)
                    </Label>
                    <Input
                      type="number"
                      min={100}
                      step={1}
                      placeholder="400"
                      value={config.criticalReserveRatio}
                      onChange={(e) => updateConfig("criticalReserveRatio", e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-[#FFE66D]">
                      Stable Token
                    </p>
                    <Input
                      placeholder="Token Name"
                      value={config.peggedAssetName}
                      onChange={(e) => updateConfig("peggedAssetName", e.target.value)}
                      className={inputClasses}
                    />
                    <Input
                      placeholder="SYMBOL"
                      value={config.peggedAssetSymbol}
                      onChange={(e) => updateConfig("peggedAssetSymbol", e.target.value.toUpperCase())}
                      className={`${inputClasses} font-mono`}
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-[#FF6B6B]">
                      Volatile Token
                    </p>
                    <Input
                      placeholder="Token Name"
                      value={config.protonName}
                      onChange={(e) => updateConfig("protonName", e.target.value)}
                      className={inputClasses}
                    />
                    <Input
                      placeholder="SYMBOL"
                      value={config.protonSymbol}
                      onChange={(e) => updateConfig("protonSymbol", e.target.value.toUpperCase())}
                      className={`${inputClasses} font-mono`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.4em] text-white/60">
                    Treasury (Fee Recipient)
                  </Label>
                  <Input
                    placeholder="0x..."
                    value={config.treasury}
                    onChange={(e) => updateConfig("treasury", e.target.value)}
                    className={`${inputClasses} font-mono`}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ConnectButton.Custom>
                  {({ account, chain, openConnectModal, openChainModal, mounted }) => {
                    const ready = mounted
                    const connected = ready && account && chain

                    if (!ready) {
                      return (
                        <Button
                          size="lg"
                          className="w-full h-14 rounded-none border border-white/60 bg-white text-black uppercase tracking-[0.3em] text-xs"
                          disabled
                        >
                          <Wallet className="mr-2 h-5 w-5" />
                          Loading Wallet
                        </Button>
                      )
                    }

                    if (!connected) {
                      return (
                        <Button
                          size="lg"
                          className="w-full h-14 rounded-none border border-white/60 bg-white text-black hover:bg-[#C6FFDD] hover:text-[#050608] transition-colors duration-200 uppercase tracking-[0.3em] text-xs cursor-pointer"
                          onClick={openConnectModal}
                        >
                          <Wallet className="mr-2 h-5 w-5" />
                          Connect Wallet
                        </Button>
                      )
                    }

                    if (chain?.unsupported) {
                      return (
                        <Button
                          size="lg"
                          className="w-full h-14 rounded-none border border-white/60 bg-white text-black hover:bg-[#C6FFDD] hover:text-[#050608] transition-colors duration-200 uppercase tracking-[0.3em] text-xs cursor-pointer"
                          onClick={openChainModal}
                        >
                          Switch Network
                        </Button>
                      )
                    }

                    return (
                      <Button
                        size="lg"
                        className="w-full h-14 rounded-none border border-white/60 bg-white text-black hover:bg-[#C6FFDD] hover:text-[#050608] transition-colors duration-200 uppercase tracking-[0.3em] text-xs cursor-pointer"
                        onClick={handleDeploy}
                        disabled={!isFormValid() || isDeploying || isConfirming}
                      >
                        {isDeploying ? (
                          <>
                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-black" />
                            Deploying
                          </>
                        ) : isConfirming ? (
                          <>
                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-black" />
                            Confirming
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-5 w-5" />
                            Deploy Reactor
                          </>
                        )}
                      </Button>
                    )
                  }}
                </ConnectButton.Custom>

                {isSuccess && (
                  <div className="border border-[#34D399]/40 bg-[#10221A] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#34D399]" />
                      <div>
                        <div className="text-xs uppercase tracking-[0.3em] text-[#34D399]">
                          Reactor Deployed
                        </div>
                        <div className="mt-1 font-mono text-xs text-[#86EFAC] break-all">
                          {hash}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
