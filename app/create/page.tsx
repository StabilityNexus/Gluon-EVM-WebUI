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
import TokenSelector from "@/components/TokenSelector"
import { PageHeader } from "@/components/PageHeader"
import OraclePreflightPanel from "@/components/OraclePreflightPanel"
import {
  runOraclePreflight,
  type OraclePreflightResult,
} from "@/utils/oraclePreflight"

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

type OracleProvider = "existing" | "chainlink" | "orb"

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
    criticalReserveRatio: "120",
  })

  const [oracleProvider, setOracleProvider] = useState<OracleProvider>("existing")
  const [chainlinkFeed, setChainlinkFeed] = useState("")
  const [isAdapterConfirming, setIsAdapterConfirming] = useState(false)
  const [oraclePreflight, setOraclePreflight] =
    useState<OraclePreflightResult | null>(null)
  const [preflightError, setPreflightError] = useState<string | null>(null)
  const [isOracleChecking, setIsOracleChecking] = useState(false)
  const latestChainIdRef = useRef(chainId)
  const adapterDeploymentInProgressRef = useRef(false)
  const preflightRequestRef = useRef(0)
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

  const invalidateOraclePreflight = () => {
    preflightRequestRef.current += 1
    setOraclePreflight(null)
    setPreflightError(null)
    setIsOracleChecking(false)
  }

  const setOracleAddress = (value: string) => {
    invalidateOraclePreflight()
    updateConfig("oracleAddress", value)
  }

  const selectOracleProvider = (provider: OracleProvider) => {
    if (provider !== oracleProvider) {
      setChainlinkFeed("")
      setOracleAddress("")
      setOracleProvider(provider)
    }
  }

  const checkOracleAddress = async (
    oracleAddress: string
  ): Promise<OraclePreflightResult | null> => {
    if (!publicClient) {
      invalidateOraclePreflight()
      setPreflightError("Network client is not available.")
      return null
    }

    const checkedChainId = chainId
    const requestId = preflightRequestRef.current + 1

    preflightRequestRef.current = requestId
    setIsOracleChecking(true)
    setOraclePreflight(null)
    setPreflightError(null)

    try {
      const result = await runOraclePreflight(
        publicClient,
        oracleAddress,
        checkedChainId
      )

      if (
        preflightRequestRef.current !== requestId ||
        latestChainIdRef.current !== checkedChainId
      ) {
        return null
      }

      setOraclePreflight(result)
      return result
    } catch (error) {
      if (
        preflightRequestRef.current !== requestId ||
        latestChainIdRef.current !== checkedChainId
      ) {
        return null
      }

      console.error("Oracle preflight failed:", error)
      setPreflightError(
        "Unable to reach the current network. Check your connection and try again."
      )
      return null
    } finally {
      if (preflightRequestRef.current === requestId) {
        setIsOracleChecking(false)
      }
    }
  }

  const isOraclePreflightCurrent =
    oraclePreflight !== null &&
    oraclePreflight.chainId === chainId &&
    oraclePreflight.address.toLowerCase() ===
      config.oracleAddress.trim().toLowerCase()

  const isOracleReady =
    isOraclePreflightCurrent && oraclePreflight.status !== "blocked"

  const [hasSetDefaultTreasury, setHasSetDefaultTreasury] = useState(false)

  useEffect(() => {
    latestChainIdRef.current = chainId
    preflightRequestRef.current += 1
    setOraclePreflight(null)
    setPreflightError(null)
    setIsOracleChecking(false)
    setChainlinkFeed("")
    setConfig((prev) => ({ ...prev, oracleAddress: "" }))

    if (!CHAINLINK_SUPPORTED_CHAIN_IDS.has(chainId)) {
      setOracleProvider((current) =>
        current === "chainlink" ? "existing" : current
      )
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

      setOracleAddress(receipt.contractAddress)

      const preflightResult = await checkOracleAddress(
        receipt.contractAddress
      )

      if (!preflightResult) {
        toast.error(
          "Adapter deployed, but the oracle preflight could not be completed."
        )
        return
      }

      if (preflightResult.status === "blocked") {
        toast.error("Adapter deployed, but it failed the IOracle preflight.")
        return
      }

      toast.success("Chainlink adapter deployed and compatible")
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

    const deploymentChainId = chainId
    const factoryAddress =
      StableCoinFactories[deploymentChainId as keyof typeof StableCoinFactories]

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
    if (Number.isNaN(ratioValue) || ratioValue < 100 || ratioValue >= 200) {
      toast.error("Critical reserve ratio must be at least 100% and below 200%")
      return
    }

    const criticalReserveRatioWad = parseUnits((ratioValue / 100).toString(), 18)
    if (criticalReserveRatioWad < parseUnits("1", 18) || criticalReserveRatioWad >= parseUnits("2", 18)) {
      toast.error("Critical reserve ratio must be at least 100% and below 200%")
      return
    }

    const deploymentPreflight = await checkOracleAddress(oracleAddress)

    if (!deploymentPreflight) {
      toast.error("Oracle preflight could not be completed.")
      return
    }

    if (deploymentPreflight.status === "blocked") {
      toast.error("Oracle is not compatible with the current IOracle interface.")
      return
    }

    if (latestChainIdRef.current !== deploymentChainId) {
      toast.error("Network changed during preflight. Please try again.")
      return
    }

    const account = address as `0x${string}`

    try {
      await writeContractAsync({
        account,
        chainId: deploymentChainId,
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
    "bg-background border border-input text-sm text-foreground placeholder:text-faint-foreground hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus:border-foreground/40 transition-[border-color,box-shadow] duration-150 px-3.5 rounded-lg cursor-text"
  const inputClasses = `${fieldBaseClasses} h-12`

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Toaster position="bottom-right" richColors />


      <div className="container-page py-10 sm:py-14">
        <div className="w-full max-w-3xl mx-auto">
          <PageHeader
            title="Create a reactor"
            description="Configure collateral, oracle wiring, token parameters, treasury, and reserve policy for a new Gluon reactor."
          />

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-5 sm:px-8">
              <h2 className="text-base font-semibold tracking-tight">
                Reactor configuration
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review each field carefully before submitting the deployment transaction.
              </p>
            </div>

            <div className="grid gap-8 px-5 py-7 sm:px-8 sm:py-8">

              {!isConnected && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-muted-foreground">
                  <Wallet className="h-5 w-5" />
                  <span className="text-[13px]">
                    Connect your wallet to authorize deployment
                  </span>
                </div>
              )}

              <div className="grid gap-7">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-foreground/80">
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
                    <Label className="text-[13px] font-medium text-foreground/80">
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
                    <Label className="text-[13px] font-medium text-foreground/80">
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
                  <Label className="text-[13px] font-medium text-foreground/80">
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
                  <Label className="text-[13px] font-medium text-foreground/80">
                    Oracle Provider
                  </Label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      aria-pressed={oracleProvider === "existing"}
                      disabled={isAdapterDeploymentBusy}
                      onClick={() => selectOracleProvider("existing")}
                      className={`h-12 rounded-lg border text-[13px] transition-colors ${
                        oracleProvider === "existing"
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/40"
                      }`}
                    >
                      Existing Adapter
                    </button>

                    <button
                      type="button"
                      aria-pressed={oracleProvider === "chainlink"}
                      disabled={!isChainlinkSupported || isAdapterDeploymentBusy}
                      onClick={() => selectOracleProvider("chainlink")}
                      className={`h-12 rounded-lg border text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        oracleProvider === "chainlink"
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/40"
                      }`}
                    >
                      Chainlink
                    </button>

                    <button
                      type="button"
                      aria-pressed={oracleProvider === "orb"}
                      disabled={isAdapterDeploymentBusy}
                      onClick={() => selectOracleProvider("orb")}
                      className={`h-12 rounded-lg border text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        oracleProvider === "orb"
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/40"
                      }`}
                    >
                      Orb
                    </button>
                  </div>

                  {!isChainlinkSupported && (
                    <p className="text-[13px] text-muted-foreground/75">
                      Chainlink feeds are not configured for this network.
                    </p>
                  )}

                  {oracleProvider !== "chainlink" ? (
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium text-foreground/80">
                        {oracleProvider === "orb"
                          ? "Orb Oracle Address"
                          : "Oracle Adapter Address"}
                      </Label>
                      <Input
                        placeholder="0x..."
                        value={config.oracleAddress}
                        onChange={(e) => setOracleAddress(e.target.value)}
                        className={`${inputClasses} font-mono`}
                      />

                      {oracleProvider === "orb" && (
                        <p className="text-[13px] leading-5 text-muted-foreground/75">
                          Orb connects directly to Gluon through IOracle; no
                          adapter deployment is required. Preflight checks the
                          current oracle state and cannot guarantee future Orb
                          governance or blacklist state.
                        </p>
                      )}

                      {config.oracleAddress.trim() && (
                        <OraclePreflightPanel
                          result={
                            isOraclePreflightCurrent ? oraclePreflight : null
                          }
                          isChecking={isOracleChecking}
                          error={preflightError}
                          onCheck={() => {
                            void checkOracleAddress(config.oracleAddress)
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-[13px] font-medium text-foreground/80">
                        Chainlink Feed Address
                      </Label>
                      <Input
                        placeholder="0x..."
                        disabled={isAdapterDeploymentBusy}
                        value={chainlinkFeed}
                        onChange={(e) => {
                          setChainlinkFeed(e.target.value)
                          setOracleAddress("")
                        }}
                        className={`${inputClasses} font-mono`}
                      />

                      <button
                        type="button"
                        onClick={handleDeployChainlinkAdapter}
                        disabled={isAdapterDeploymentBusy}
                        className="h-12 w-full rounded-lg border border-border bg-muted/40 text-[13px] text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAdapterDeploymentBusy
                          ? "Deploying Adapter..."
                          : "Deploy Chainlink Adapter"}
                      </button>

                      {config.oracleAddress && (
                        <>
                          <p className="break-all font-mono text-xs text-foreground/80">
                            Adapter: {config.oracleAddress}
                          </p>

                          <OraclePreflightPanel
                            result={
                              isOraclePreflightCurrent ? oraclePreflight : null
                            }
                            isChecking={isOracleChecking}
                            error={preflightError}
                            onCheck={() => {
                              void checkOracleAddress(config.oracleAddress)
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground/80">
                      Critical Reserve Ratio (%)
                    </Label>
                    <Input
                      type="number"
                      min={100}
                      max={199}
                      step={1}
                      placeholder="120"
                      value={config.criticalReserveRatio}
                      onChange={(e) => updateConfig("criticalReserveRatio", e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
                      <span aria-hidden="true" className="size-2.5 rounded-full bg-neutron" />
                      Stable token (Neutron)
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
                    <p className="flex items-center gap-2 text-[13px] font-medium text-foreground/80">
                      <span aria-hidden="true" className="size-2.5 rounded-full bg-proton" />
                      Volatile token (Proton)
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
                  <Label className="text-[13px] font-medium text-foreground/80">
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
                          className="w-full h-12 text-[15px]"
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
                          className="w-full h-12 text-[15px]"
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
                          className="w-full h-12 text-[15px]"
                          onClick={openChainModal}
                        >
                          Switch Network
                        </Button>
                      )
                    }

                    return (
                      <Button
                        size="lg"
                        className="w-full h-12 text-[15px]"
                        onClick={handleDeploy}
                        disabled={
                          !isFormValid() ||
                          !isOracleReady ||
                          isOracleChecking ||
                          isDeploying ||
                          isConfirming
                        }
                      >
                        {isDeploying ? (
                          <>
                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-background" />
                            Deploying
                          </>
                        ) : isConfirming ? (
                          <>
                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-background" />
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
                  <div className="rounded-xl border border-success/30 bg-success/10 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <div className="text-xs text-success">
                          Reactor Deployed
                        </div>
                        <div className="mt-1 font-mono text-xs text-success break-all">
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
