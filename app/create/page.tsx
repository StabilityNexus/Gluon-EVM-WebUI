"use client"

import { useEffect, useRef, useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useDeployContract, usePublicClient, useReadContract } from "wagmi"
import { formatUnits, parseUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, CheckCircle, ChevronDown, Zap } from "lucide-react"
import { WalletButton } from "@/components/WalletButton"
import { FactoryABI } from "@/utils/abi/Factory"
import { parseBetaParameters, retentionAfterHour } from "@/utils/betaParameters"
import { ERC20ABI } from "@/utils/abi/StableCoin"
import {
  ChainlinkToOracleAdapterABI,
  ChainlinkToOracleAdapterBytecode,
} from "@/utils/abi/ChainlinkToOracleAdapter"
import { StableCoinFactories } from "@/utils/addresses"
import { GLUON_NETWORKS, SEPOLIA_CHAIN_ID } from "@/utils/networks"
import { toast } from "sonner"
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
  criticalReserveRatio: string
  initialReserveRatio: string
  initialReserve: string
  fissionFee: string
  fusionFee: string
  betaFeePercent: string
  betaVolumeCoefficient: string
  volumeRetentionPerHour: string
}

type OracleProvider = "existing" | "chainlink" | "orb"

const CHAINLINK_SUPPORTED_CHAIN_IDS = new Set<number>([SEPOLIA_CHAIN_ID])

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
  const { address, isConnected, chain: walletChain } = useAccount()
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
    criticalReserveRatio: "103",
    initialReserveRatio: "150",
    initialReserve: "0.1",
    fissionFee: "0",
    fusionFee: "0",
    betaFeePercent: "0",
    betaVolumeCoefficient: "0",
    volumeRetentionPerHour: "1",
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
  const currentNetwork = GLUON_NETWORKS.find(({ chain }) => chain.id === chainId)
  const isAdapterDeploymentBusy = isAdapterDeploying || isAdapterConfirming

  const { data: factoryDevFee } = useReadContract({
    address: currentNetwork?.factoryAddress,
    abi: FactoryABI,
    functionName: "devFee",
    chainId,
    query: { enabled: !!currentNetwork?.factoryAddress },
  })
  let hourlyRetentionText = "—"
  try {
    hourlyRetentionText = formatUnits(retentionAfterHour(parseBetaParameters(config).decayPerSecondWad), 18)
  } catch { /* Invalid input is explained before submission. */ }

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
           config.criticalReserveRatio &&
           config.initialReserveRatio &&
           config.initialReserve &&
           config.fissionFee !== "" &&
           config.fusionFee !== "" &&
           config.betaFeePercent !== "" &&
           config.betaVolumeCoefficient !== "" &&
           config.volumeRetentionPerHour !== ""
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

    if (!publicClient) {
      toast.error("Network client is not available")
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
      toast.error("Reserve asset name cannot be empty")
      return
    }

    const baseAssetSymbol = config.baseAssetSymbol.trim()
    if (!baseAssetSymbol) {
      toast.error("Reserve asset symbol cannot be empty")
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
      toast.error("Reserve token must be a 20-byte checksum address")
      return
    }

    const oracleAddress = config.oracleAddress.trim()
    if (!/^0x[0-9a-fA-F]{40}$/.test(oracleAddress)) {
      toast.error("Oracle address must be a 20-byte checksum address")
      return
    }

    let criticalReserveRatioWad: bigint
    let initialReserveRatioWad: bigint
    try {
      [criticalReserveRatioWad, initialReserveRatioWad] = [
        config.criticalReserveRatio,
        config.initialReserveRatio,
      ].map((value) => {
        const text = value.trim()
        if (!/^\d+(?:\.\d{0,16})?$/.test(text)) {
          throw new Error("Reserve ratios must be decimal percentages with at most 16 decimal places")
        }
        // One percentage point equals 1e16 in WAD units.
        return parseUnits(text, 16)
      })
      if (
        criticalReserveRatioWad <= parseUnits("1", 18) ||
        criticalReserveRatioWad >= parseUnits("2", 18)
      ) {
        throw new Error("Critical reserve ratio must be above 100% and below 200%")
      }
      if (
        initialReserveRatioWad <= criticalReserveRatioWad ||
        initialReserveRatioWad >= parseUnits("2", 18)
      ) {
        throw new Error("Initial reserve ratio must be above the critical ratio and below 200%")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid reserve ratios")
      return
    }

    const initialReserveValue = Number(config.initialReserve)
    if (!Number.isFinite(initialReserveValue) || initialReserveValue <= 0) {
      toast.error("Initial reserve must be greater than zero")
      return
    }

    const fissionFeePercent = Number(config.fissionFee)
    const fusionFeePercent = Number(config.fusionFee)

    if (
      !Number.isFinite(fissionFeePercent) ||
      fissionFeePercent < 0 ||
      fissionFeePercent >= 100
    ) {
      toast.error("Fission fee must be at least 0% and below 100%")
      return
    }

    if (
      !Number.isFinite(fusionFeePercent) ||
      fusionFeePercent < 0 ||
      fusionFeePercent >= 100
    ) {
      toast.error("Fusion fee must be at least 0% and below 100%")
      return
    }

    const fissionFeeWad = parseUnits(config.fissionFee, 16)
    const fusionFeeWad = parseUnits(config.fusionFee, 16)

    if (typeof factoryDevFee !== "bigint" || factoryDevFee < 0n || factoryDevFee >= 10n ** 18n) {
      toast.error("Factory dev fee unavailable. Please try again.")
      return
    }
    if (fissionFeeWad + factoryDevFee >= 10n ** 18n || fusionFeeWad + factoryDevFee >= 10n ** 18n) {
      toast.error("Each fission or fusion fee plus the factory dev fee must be below 100%")
      return
    }

    let betaParameters: ReturnType<typeof parseBetaParameters>
    try {
      betaParameters = parseBetaParameters(config)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid transmutation settings")
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
      const baseDecimals = await publicClient.readContract({
        address: baseToken as `0x${string}`,
        abi: ERC20ABI,
        functionName: "decimals",
      })

      const reserveInput = config.initialReserve.trim()
      const decimals = Number(baseDecimals)
      const [, fraction = ""] = reserveInput.split(".")
      if (!/^\d+(\.\d+)?$/.test(reserveInput) || fraction.length > decimals) {
        toast.error(`Initial reserve must be a decimal with at most ${decimals} decimal places`)
        return
      }
      const initialReserveAmount = parseUnits(reserveInput, decimals)
      if (initialReserveAmount <= 0n) {
        toast.error("Initial reserve must be greater than zero")
        return
      }

      const currentAllowance = await publicClient.readContract({
        address: baseToken as `0x${string}`,
        abi: ERC20ABI,
        functionName: "allowance",
        args: [account, factoryAddress],
      })

      if (currentAllowance < initialReserveAmount) {
        toast.info("Approve the Factory to transfer the initial reserve")

        const approvalHash = await writeContractAsync({
          account,
          chainId: deploymentChainId,
          address: baseToken as `0x${string}`,
          abi: ERC20ABI,
          functionName: "approve",
          args: [factoryAddress, initialReserveAmount],
        })

        const approvalReceipt =
          await publicClient.waitForTransactionReceipt({
            hash: approvalHash,
          })

        if (approvalReceipt.status !== "success") {
          toast.error("Initial reserve approval failed")
          return
        }

        toast.success("Initial reserve approved")
      }

      if (latestChainIdRef.current !== deploymentChainId) {
        toast.error("Network changed during approval. Please try again.")
        return
      }

      const deploymentArgs = [
        vaultName,
        baseAssetName,
        baseAssetSymbol,
        peggedAssetName,
        peggedAssetSymbol,
        baseToken as `0x${string}`,
        oracleAddress as `0x${string}`,
        protonName,
        protonSymbol,
        fissionFeeWad,
        fusionFeeWad,
        criticalReserveRatioWad,
        initialReserveRatioWad,
        initialReserveAmount,
      ] as const
      await writeContractAsync({
        account,
        chainId: deploymentChainId,
        address: factoryAddress,
        abi: FactoryABI,
        functionName: "deployReactor",
        args: [
          ...deploymentArgs,
          betaParameters.betaPhi0,
          betaParameters.betaPhi1,
          betaParameters.decayPerSecondWad,
        ],
      })
    } catch (error) {
      console.error("Deployment error:", error)
      toast.error("Failed to deploy reactor")
    }
  }

  const fieldBaseClasses =
    "bg-background border border-input text-sm text-foreground placeholder:text-faint-foreground hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus:border-foreground/40 transition-[border-color,box-shadow] duration-150 px-3.5 rounded-lg cursor-text"
  const inputClasses = `${fieldBaseClasses} h-11`

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">


      <div className="container-page py-10 sm:py-14">
        <div className="w-full max-w-4xl mx-auto">
          <PageHeader
            title="Deploy a new Reactor"
            description="Choose the parameters and create your own stablecoin."
          />

          {!currentNetwork?.factoryAddress && (
            <p role="status" className="mb-5 text-sm text-muted-foreground">
              Reactor deployment is not yet available on this network.
            </p>
          )}

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid gap-6 px-5 py-6 sm:px-6">

              {!isConnected && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-muted-foreground">
                  <Wallet className="h-5 w-5" />
                  <span className="text-[13px]">
                    Connect your wallet to authorize deployment
                  </span>
                </div>
              )}

              <div className="grid gap-6">
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
                      Reserve Asset Name
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
                      Reserve Asset Symbol
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
                    Reserve Token
                  </Label>
                  <TokenSelector
                    value={config.baseToken}
                    onChange={(address) => updateConfig("baseToken", address)}
                    placeholder="0x..."
                    label=""
                    required={true}
                  />
                </div>

                <fieldset className="space-y-4 rounded-xl border border-border p-4">
                  <legend className="px-2 text-sm font-medium">Oracle</legend>
                  <div className="space-y-2">
                    <Label htmlFor="deployed-oracle" className="text-xs text-muted-foreground">Choose a deployed oracle</Label>
                    <div className="relative">
                      <select
                        id="deployed-oracle"
                        className={`${inputClasses} w-full appearance-none pr-10`}
                        value={currentNetwork?.oracles?.some(({ address }) => address.toLowerCase() === config.oracleAddress.toLowerCase()) ? config.oracleAddress : ""}
                        disabled={isAdapterDeploymentBusy}
                        onChange={(event) => {
                          const selected = currentNetwork?.oracles?.find(({ address }) => address === event.target.value)
                          selectOracleProvider(selected?.provider ?? "existing")
                          setOracleAddress(selected?.address ?? "")
                        }}
                      >
                        <option value="">Enter manually</option>
                        {currentNetwork?.oracles?.map(({ address, name }) => <option key={address} value={address}>{name}</option>)}
                      </select>
                      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  {!currentNetwork?.oracles?.length && <p className="text-xs text-muted-foreground">No deployed oracles have been verified for this network.</p>}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      aria-pressed={oracleProvider === "existing"}
                      disabled={isAdapterDeploymentBusy}
                      onClick={() => selectOracleProvider("existing")}
                      className={`h-10 rounded-lg border px-2 text-xs sm:text-[13px] transition-colors ${
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
                      className={`h-10 rounded-lg border px-2 text-xs sm:text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
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
                      className={`h-10 rounded-lg border px-2 text-xs sm:text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
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
                </fieldset>

                <fieldset className="grid gap-4 sm:grid-cols-3">
                  <legend className="mb-3 text-sm font-medium">Reserve settings</legend>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium text-foreground/80">
                      Initial Reserve
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.1"
                      value={config.initialReserve}
                      onChange={(e) =>
                        updateConfig("initialReserve", e.target.value)
                      }
                      className={inputClasses}
                    />
                    <p className="text-[12px] text-muted-foreground/75">
                      Amount of the selected reserve token deposited when the reactor is created.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="critical-reserve-ratio" className="text-[13px] font-medium text-foreground/80">
                      Critical Reserve Ratio (%)
                    </Label>
                    <Input
                      id="critical-reserve-ratio"
                      type="number"
                      min={100}
                      max={200}
                      step="any"
                      placeholder="103"
                      value={config.criticalReserveRatio}
                      onChange={(e) => updateConfig("criticalReserveRatio", e.target.value)}
                      aria-describedby="critical-reserve-ratio-help"
                      className={inputClasses}
                    />
                    <p id="critical-reserve-ratio-help" className="text-[12px] text-muted-foreground/75">
                      Recommended: 101%–105%. Must be above 100% and below 200%.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="initial-reserve-ratio" className="text-[13px] font-medium text-foreground/80">
                      Initial Reserve Ratio (%)
                    </Label>
                    <Input
                      id="initial-reserve-ratio"
                      type="number"
                      min={100}
                      max={200}
                      step="any"
                      placeholder="150"
                      value={config.initialReserveRatio}
                      onChange={(e) => updateConfig("initialReserveRatio", e.target.value)}
                      aria-describedby="initial-reserve-ratio-help"
                      className={inputClasses}
                    />
                    <p id="initial-reserve-ratio-help" className="text-[12px] text-muted-foreground/75">
                      Must be above the critical ratio and below 200%. Retained fission fees and rounding can raise the actual starting ratio.
                    </p>
                  </div>

                </fieldset>

                <fieldset className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
                  <legend className="px-2 text-sm font-medium">Protocol fees</legend>
                  <div className="space-y-2">
                    <Label htmlFor="fission-fee" className="text-[13px] font-medium text-foreground/80">
                      Fission Fee (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="99.9999"
                      step="0.01"
                      id="fission-fee"
                      value={config.fissionFee}
                      onChange={(e) => updateConfig("fissionFee", e.target.value)}
                      className={inputClasses}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fusion-fee" className="text-[13px] font-medium text-foreground/80">
                      Fusion Fee (%)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="99.9999"
                      step="0.01"
                      id="fusion-fee"
                      value={config.fusionFee}
                      onChange={(e) => updateConfig("fusionFee", e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </fieldset>

                <fieldset className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-3">
                  <legend className="px-1 text-[13px] font-medium text-foreground/80">
                    Transmutation settings
                  </legend>
                  <div className="space-y-2">
                    <Label htmlFor="beta-fee-percent" className="text-[13px] font-medium text-foreground/80">
                      Base transmutation fee (%)
                    </Label>
                    <Input
                      id="beta-fee-percent"
                      type="text"
                      inputMode="decimal"
                      value={config.betaFeePercent}
                      onChange={(e) => updateConfig("betaFeePercent", e.target.value)}
                      aria-describedby="beta-fee-help"
                      className={inputClasses}
                    />
                    <p id="beta-fee-help" className="text-[12px] text-muted-foreground">
                      Between 0 and 100. A 100% fee prevents transmutations from producing tokens.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beta-volume-coefficient" className="text-[13px] font-medium text-foreground/80">
                      Volume fee coefficient
                    </Label>
                    <Input
                      id="beta-volume-coefficient"
                      type="text"
                      inputMode="decimal"
                      value={config.betaVolumeCoefficient}
                      onChange={(e) => updateConfig("betaVolumeCoefficient", e.target.value)}
                      aria-describedby="beta-volume-help"
                      className={inputClasses}
                    />
                    <p id="beta-volume-help" className="text-[12px] text-muted-foreground">
                      Between 0 and 1. Controls how strongly historical transmutation volume increases the fee.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="volume-retention" className="text-[13px] font-medium text-foreground/80">
                      Volume retained each hour
                    </Label>
                    <Input
                      id="volume-retention"
                      type="text"
                      inputMode="decimal"
                      value={config.volumeRetentionPerHour}
                      onChange={(e) => updateConfig("volumeRetentionPerHour", e.target.value)}
                      aria-describedby="volume-retention-help"
                      className={inputClasses}
                    />
                    <p id="volume-retention-help" className="text-[12px] text-muted-foreground">
                      Enter 0–1. Use 1 for no decay; 0.5 keeps about 50% after an hour.
                    </p>
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer underline underline-offset-4">Conversion details</summary>
                      <p className="mt-2 leading-relaxed">
                        Rounded to a per-second setting that retains at least the requested fraction over an hour. Actual hourly retention: {hourlyRetentionText}. Zero clears past volume after the first second.
                      </p>
                    </details>
                  </div>
                </fieldset>

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

                <p className="text-sm text-muted-foreground">
                  {typeof factoryDevFee === "bigint"
                    ? `The separate dev fee is ${formatUnits(factoryDevFee, 16)}%. Fission, fusion and transmutation fees remain in the reserve.`
                    : "The separate dev fee is read from the configured factory. Fission, fusion and transmutation fees remain in the reserve."}
                </p>
              </div>

              <div className="space-y-4">
                {!isConnected || !address || !walletChain ? (
                  <WalletButton mode="action" className="w-full" />
                ) : (
                  <Button
                    size="lg"
                    className="w-full h-12 text-[15px]"
                    onClick={handleDeploy}
                    disabled={
                      !StableCoinFactories[chainId] ||
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
                )}
                <p className="mt-3 text-center text-xs text-muted-foreground">Review all parameters carefully before deploying. They are immutable: they cannot be changed afterwards.</p>

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
