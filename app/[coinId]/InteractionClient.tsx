"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/PageHeader"
import {
  useAccount,
  useBalance,
  useChainId,
  usePublicClient,
  useReadContract,
  useSendTransaction,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  Copy,
  Info,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import {
  StableCoinReactorABI,
  WrappedNativeABI,
  ERC20ABI,
} from "@/utils/abi/StableCoin"
import { getGluonNetwork } from "@/utils/networks"
import {
  addressesEqual,
  grossFusionAmountForNet,
  resolveNativeAssetConfig,
} from "@/utils/nativeAsset"
import { toast } from "sonner"

type TokenOption = "BASE" | "BUNDLE" | "NEUTRON" | "PROTON"
type SwapRoute = "FISSION" | "FUSION" | "PROTON_TO_NEUTRON" | "NEUTRON_TO_PROTON"
const allowedTargets: Record<TokenOption, TokenOption[]> = {
  BASE: ["BUNDLE"],
  BUNDLE: ["BASE"],
  NEUTRON: ["PROTON"],
  PROTON: ["NEUTRON"],
}

const routeMap: Record<string, SwapRoute> = {
  "BASE->BUNDLE": "FISSION",
  "BUNDLE->BASE": "FUSION",
  "PROTON->NEUTRON": "PROTON_TO_NEUTRON",
  "NEUTRON->PROTON": "NEUTRON_TO_PROTON",
}

const containerStyle = {
  fontFamily: "'Orbitron', 'Space Mono', 'Courier New', monospace",
  fontWeight: "500",
}

const formatPercentFromWad = (value?: bigint) => {
  if (!value) return "0.0%"
  const percent = Number(value) / 1e16
  return `${percent.toFixed(1)}%`
}

const formatFeeFromWad = (value?: bigint) => {
  if (!value) return "0.00%"
  return `${(Number(value) / 1e16).toFixed(2)}%`
}

const trimFormattedAmount = (value: string, precision = 6) => {
  const [integer, fraction] = value.split(".")
  if (!fraction) return integer
  const sliced = fraction.slice(0, precision).replace(/0+$/, "")
  return sliced.length ? `${integer}.${sliced}` : integer
}

const formatBalance = (balance?: bigint, decimals?: number, precision = 4) => {
  if (balance === undefined || decimals === undefined) return "0"
  const formatted = formatUnits(balance, decimals)
  return trimFormattedAmount(formatted, precision)
}

const pow10 = (decimals: number) => BigInt(10) ** BigInt(decimals)

const safeParseUnits = (value: string, decimals?: number) => {
  if (decimals === undefined) return null
  if (!value || Number(value) === 0) return BigInt(0)
  try {
    return parseUnits(value, decimals)
  } catch (error) {
    console.error("Failed to parse units:", error)
    return null
  }
}

const shortenAddress = (value?: string, guard = 4) => {
  if (!value) return "—"
  if (value.length <= guard * 2 + 3) return value
  return `${value.slice(0, guard + 2)}…${value.slice(-guard)}`
}

const WAD = 10n ** 18n
const PEGGED_ASSET_WAD = 10n ** 18n

const mulDiv = (a: bigint, b: bigint, denominator: bigint) => {
  if (denominator === 0n) return 0n
  return (a * b) / denominator
}

const scaleToWad = (value?: bigint, decimals?: number) => {
  if (value === undefined || decimals === undefined) return undefined
  if (decimals === 0) return value * WAD
  const scale = pow10(decimals)
  return scale === 0n ? undefined : mulDiv(value, WAD, scale)
}

const computeQWad = (
  reserveWad?: bigint,
  neutronSupplyWad?: bigint,
  basePriceWad?: bigint,
  criticalReserveRatio?: bigint,
): bigint | undefined => {
  if (
    reserveWad === undefined ||
    neutronSupplyWad === undefined ||
    basePriceWad === undefined ||
    basePriceWad === 0n
  ) {
    return undefined
  }
  if (neutronSupplyWad === 0n) return 0n

  const pStarBaseWad = mulDiv(WAD, WAD, basePriceWad)
  if (pStarBaseWad === 0n) return undefined

  const denom = mulDiv(neutronSupplyWad, pStarBaseWad, WAD)
  if (denom === 0n) return undefined

  const rWad = mulDiv(reserveWad, WAD, denom)
  const critical = criticalReserveRatio && criticalReserveRatio > 0n ? criticalReserveRatio : WAD
  let rTilde = rWad
  if (rWad <= critical) {
    const diff = critical > WAD ? critical - WAD : 0n
    const rOverStar = mulDiv(rWad, WAD, critical === 0n ? WAD : critical)
    const part = mulDiv(rOverStar, diff, WAD)
    rTilde = WAD + part
  }
  if (rTilde === 0n) return undefined
  const q = mulDiv(WAD, WAD, rTilde)
  return q > WAD ? WAD : q
}

type InfoRow = {
  label: string
  value: string
  monospace?: boolean
  emphasize?: boolean
}

type InfoSection = {
  title: string
  description?: string
  items: InfoRow[]
}

const formatTokenValue = (
  amount: bigint | null | undefined,
  decimals?: number,
  symbol?: string,
  precision = 6,
) => {
  if (amount === null || amount === undefined || decimals === undefined) return "—"
  const formatted = formatBalance(amount, decimals, precision)
  return symbol ? `${formatted} ${symbol}` : formatted
}

const formatWad = (value?: bigint, precision = 4) => {
  if (value === undefined) return "—"
  const formatted = formatUnits(value, 18)
  return trimFormattedAmount(formatted, precision)
}

export default function InteractionClient({ coinId }: { coinId: string }) {
  const searchParams = useSearchParams()
  const reactorAddress = coinId === "c" ? searchParams.get("coin") : coinId

  if (!reactorAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Reactor Address</h2>
          <p className="text-muted-foreground">Please provide a valid reactor address.</p>
        </div>
      </div>
    )
  }

  return <ReactorInteractionClient reactorAddress={reactorAddress} />
}

function ReactorInteractionClient({ reactorAddress }: { reactorAddress: string }) {
  const { address } = useAccount()
  const chainId = useChainId()

  const [fromToken, setFromToken] = useState<TokenOption>("BASE")
  const [toToken, setToToken] = useState<TokenOption>("BUNDLE")
  const [amount, setAmount] = useState("")
  const [useNativeBase, setUseNativeBase] = useState(false)
  const [recipient, setRecipient] = useState("")
  const [hasSetDefaultRecipient, setHasSetDefaultRecipient] = useState(false)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  useEffect(() => {
    if (address && recipient === "" && !hasSetDefaultRecipient) {
      setRecipient(address)
      setHasSetDefaultRecipient(true)
    }
  }, [address, recipient, hasSetDefaultRecipient])

  useEffect(() => {
    const targets = allowedTargets[fromToken]
    if (!targets.includes(toToken)) {
      setToToken(targets[0])
    }
  }, [fromToken, toToken])

  const route: SwapRoute | null = useMemo(() => {
    const key = `${fromToken}->${toToken}`
    return routeMap[key] || null
  }, [fromToken, toToken])

  const { data: vaultName } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "vaultName",
  })

  const { data: oracleAddress } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "ORACLE",
  })

  const {
    data: baseToken,
    refetch: refetchBaseToken,
  } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "BASE_TOKEN",
  })

  const networkConfig = getGluonNetwork(chainId)
  const nativeAssetConfig = networkConfig?.nativeAsset

  const nativeAsset = resolveNativeAssetConfig(
    nativeAssetConfig,
    typeof baseToken === "string" ? baseToken : undefined,
  )

  const {
    data: nativeBalance,
    refetch: refetchNativeBalance,
  } = useBalance({
    address,
    chainId,
    query: {
      enabled: !!address && !!nativeAsset,
    },
  })

  useEffect(() => {
    if (!nativeAsset || (route !== "FISSION" && route !== "FUSION")) {
      setUseNativeBase(false)
    }
  }, [nativeAsset, route])

  const { data: baseAssetNameContract } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "baseAssetName",
  })

  const { data: baseAssetSymbolContract } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "baseAssetSymbol",
  })

  const { data: peggedAssetNameContract } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "peggedAssetName",
  })

  const { data: peggedAssetSymbolContract } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "peggedAssetSymbol",
  })

  const {
    data: neutronToken,
    refetch: refetchNeutronToken,
  } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "NEUTRON_TOKEN",
  })

  const {
    data: protonToken,
    refetch: refetchProtonToken,
  } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "PROTON_TOKEN",
  })

  const { data: treasury } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "TREASURY",
  })

  const {
    data: fissionFee,
    refetch: refetchFissionFee,
  } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "FISSION_FEE",
  })

  const {
    data: fusionFee,
    refetch: refetchFusionFee,
  } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "FUSION_FEE",
  })

  const {
    data: reserve,
    refetch: refetchReserve,
  } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "reserve",
  })

  const { data: criticalReserveRatio } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "CRITICAL_RESERVE_RATIO",
  })

  const { data: onChainBasePriceWad } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "getBasePriceInPeggedAsset",
    query: {
      enabled: !!reactorAddress,
    },
  })

  const {
    data: neutronTotalSupply,
    refetch: refetchNeutronTotalSupply,
  } = useReadContract({
    address: neutronToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "totalSupply",
    query: {
      enabled: !!neutronToken,
    },
  })

  const {
    data: protonTotalSupply,
    refetch: refetchProtonTotalSupply,
  } = useReadContract({
    address: protonToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "totalSupply",
    query: {
      enabled: !!protonToken,
    },
  })

  const { data: baseDecimals } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "decimals",
    query: {
      enabled: !!baseToken,
    },
  })

  const { data: neutronDecimals } = useReadContract({
    address: neutronToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "decimals",
    query: {
      enabled: !!neutronToken,
    },
  })

  const { data: protonDecimals } = useReadContract({
    address: protonToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "decimals",
    query: {
      enabled: !!protonToken,
    },
  })

  const { data: baseSymbol } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "symbol",
    query: {
      enabled: !!baseToken,
    },
  })

  const { data: neutronSymbol } = useReadContract({
    address: neutronToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "symbol",
    query: {
      enabled: !!neutronToken,
    },
  })

  const { data: protonSymbol } = useReadContract({
    address: protonToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "symbol",
    query: {
      enabled: !!protonToken,
    },
  })

  const { data: baseBalance, refetch: refetchBaseBalance } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!baseToken,
    },
  })

  const {
    data: neutronBalance,
    refetch: refetchNeutronBalance,
  } = useReadContract({
    address: neutronToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!neutronToken,
    },
  })

  const {
    data: protonBalance,
    refetch: refetchProtonBalance,
  } = useReadContract({
    address: protonToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!protonToken,
    },
  })

  const { data: baseAllowance, refetch: refetchBaseAllowance } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "allowance",
    args: [address as `0x${string}`, reactorAddress as `0x${string}`],
    query: {
      enabled: !!address && !!baseToken,
    },
  })

  const baseDecimalsNumber = typeof baseDecimals === "number" ? baseDecimals : undefined
  const neutronDecimalsNumber =
    typeof neutronDecimals === "number" ? (neutronDecimals as number) : undefined
  const protonDecimalsNumber =
    typeof protonDecimals === "number" ? (protonDecimals as number) : undefined

  const baseAmountRaw = useMemo(() => {
    if (baseDecimalsNumber === undefined) return null
    if (!amount) return null
    return safeParseUnits(amount, baseDecimalsNumber)
  }, [amount, baseDecimalsNumber])

  // Native mode treats the entered amount as the native amount the user
  // wants to receive. Calculate the smallest gross Reactor fusion amount
  // whose post-fee wrapped-native output reaches that amount.
  //
  // Existing ERC-20 fusion semantics remain unchanged.
  const fusionGrossBaseRaw = useMemo(() => {
    if (route !== "FUSION" || !useNativeBase) return null
    if (!baseAmountRaw || baseAmountRaw <= 0n) return null
    if (fusionFee === undefined) return null

    return grossFusionAmountForNet(baseAmountRaw, fusionFee)
  }, [route, useNativeBase, baseAmountRaw, fusionFee])

  const reserveWad = useMemo(
    () => scaleToWad(reserve, baseDecimalsNumber),
    [reserve, baseDecimalsNumber],
  )
  const neutronSupplyWad = useMemo(
    () => scaleToWad(neutronTotalSupply, neutronDecimalsNumber),
    [neutronTotalSupply, neutronDecimalsNumber],
  )
  const protonSupplyWad = useMemo(
    () => scaleToWad(protonTotalSupply, protonDecimalsNumber),
    [protonTotalSupply, protonDecimalsNumber],
  )
  const basePriceWad = useMemo(() => {
    if (typeof onChainBasePriceWad === "bigint" && onChainBasePriceWad > 0n) {
      return onChainBasePriceWad
    }
    return undefined
  }, [onChainBasePriceWad])
  const qWad = useMemo(
    () => computeQWad(reserveWad, neutronSupplyWad, basePriceWad, criticalReserveRatio),
    [reserveWad, neutronSupplyWad, basePriceWad, criticalReserveRatio],
  )
  const neutronPriceInBaseDerived = useMemo(() => {
    if (!reserveWad || reserveWad === 0n) return 0n
    if (!basePriceWad || basePriceWad === 0n) return undefined
    if (neutronTotalSupply === undefined || neutronDecimalsNumber === undefined) return undefined
    if (neutronTotalSupply === 0n) {
      return mulDiv(PEGGED_ASSET_WAD, WAD, basePriceWad)
    }
    if (!neutronSupplyWad || neutronSupplyWad === 0n) return undefined
    const q = qWad
    if (q === undefined) return undefined
    return mulDiv(q, reserveWad, neutronSupplyWad)
  }, [reserveWad, neutronSupplyWad, basePriceWad, neutronTotalSupply, neutronDecimalsNumber, qWad])

  const protonPriceInBaseDerived = useMemo(() => {
    if (!reserveWad || !basePriceWad) return undefined
    if (protonTotalSupply === undefined || protonDecimalsNumber === undefined) return undefined
    if (protonTotalSupply === 0n) return WAD
    if (!protonSupplyWad || protonSupplyWad === 0n) return undefined
    const q = qWad
    if (q === undefined) return undefined
    const oneMinusQ = q >= WAD ? 0n : WAD - q
    return mulDiv(oneMinusQ, reserveWad, protonSupplyWad)
  }, [reserveWad, protonSupplyWad, protonTotalSupply, protonDecimalsNumber, qWad, basePriceWad])

  const neutronPricePeggedDerived = useMemo(() => {
    if (!basePriceWad || !neutronPriceInBaseDerived) return undefined
    return mulDiv(neutronPriceInBaseDerived, basePriceWad, WAD)
  }, [basePriceWad, neutronPriceInBaseDerived])

  const protonPricePeggedDerived = useMemo(() => {
    if (!basePriceWad || !protonPriceInBaseDerived) return undefined
    return mulDiv(protonPriceInBaseDerived, basePriceWad, WAD)
  }, [basePriceWad, protonPriceInBaseDerived])

  const reserveRatioDerived = useMemo(() => {
    if (!reserveWad) return undefined
    if (!basePriceWad || basePriceWad === 0n) return undefined
    if (!neutronSupplyWad) return undefined
    if (reserveWad === 0n) return 0n
    if (neutronSupplyWad === 0n) return undefined
    const reserveValuePegged = mulDiv(reserveWad, basePriceWad, WAD)
    if (reserveValuePegged === 0n) return 0n
    return mulDiv(reserveValuePegged, WAD, neutronSupplyWad)
  }, [reserveWad, basePriceWad, neutronSupplyWad])

  const baseSymbolText =
    typeof baseSymbol === "string" && baseSymbol.length > 0
      ? baseSymbol
      : typeof baseAssetSymbolContract === "string" && baseAssetSymbolContract.length > 0
        ? baseAssetSymbolContract
        : "BASE"

  const activeBaseSymbol =
    useNativeBase && nativeAsset ? nativeAsset.nativeSymbol : baseSymbolText
  const baseAssetName =
    typeof baseAssetNameContract === "string" && baseAssetNameContract.length > 0
      ? baseAssetNameContract
      : baseSymbolText || "Base Asset"
  const peggedSymbolText =
    typeof peggedAssetSymbolContract === "string" && peggedAssetSymbolContract.length > 0
      ? peggedAssetSymbolContract
      : "PEG"
  const peggedAssetName =
    typeof peggedAssetNameContract === "string" && peggedAssetNameContract.length > 0
      ? peggedAssetNameContract
      : peggedSymbolText
  const neutronSymbolText = typeof neutronSymbol === "string" ? neutronSymbol : "NEUTRON"
  const protonSymbolText = typeof protonSymbol === "string" ? protonSymbol : "PROTON"
  const neutronPriceInBase = neutronPriceInBaseDerived
  const protonPriceInBase = protonPriceInBaseDerived
  const neutronPricePegged = neutronPricePeggedDerived
  const protonPricePegged = protonPricePeggedDerived
  const reserveRatio = reserveRatioDerived
  const basePricePegged = basePriceWad
  const baseAssetDisplay = `${baseAssetName} (${baseSymbolText})`
  const peggedAssetDisplay = `${peggedAssetName} (${peggedSymbolText})`
  const fissionFeeText = typeof fissionFee === "bigint" ? formatPercentFromWad(fissionFee) : "—"
  const fusionFeeText = typeof fusionFee === "bigint" ? formatPercentFromWad(fusionFee) : "—"
  const basePricePeggedText =
    basePricePegged !== undefined
      ? `${formatWad(basePricePegged)} ${peggedSymbolText}/${baseSymbolText}`
      : "—"
  const reserveRatioText = (() => {
    if (reserve === undefined) return "—"
    if (reserve === 0n) return "0%"
    if (neutronTotalSupply !== undefined && neutronTotalSupply === 0n) {
      return "∞ (bootstrap)"
    }
    if (reserveRatio === undefined) {
      return "—"
    }
    return formatPercentFromWad(reserveRatio)
  })()
  const criticalRatioText = criticalReserveRatio ? formatPercentFromWad(criticalReserveRatio) : "—"

  const { data: approveHash, writeContract: writeApprove, isPending: isApproving } = useWriteContract()
  const { data: fissionHash, writeContract: writeFission, isPending: isFissioning } = useWriteContract()
  const { data: fusionHash, writeContract: writeFusion, isPending: isFusing } = useWriteContract()
  const { writeContractAsync: writeNativeContract } = useWriteContract()
  const { sendTransactionAsync: sendNativeTransaction } = useSendTransaction()
  const publicClient = usePublicClient()
  const [isNativeFlowProcessing, setIsNativeFlowProcessing] = useState(false)
  const {
    data: protonToNeutronHash,
    writeContract: writeProtonToNeutron,
    isPending: isProtonToNeutronPending,
  } = useWriteContract()
  const {
    data: neutronToProtonHash,
    writeContract: writeNeutronToProton,
    isPending: isNeutronToProtonPending,
  } = useWriteContract()

  const { isLoading: isApprovingTx, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })
  const { isLoading: isFissionTx, isSuccess: isFissionSuccess } = useWaitForTransactionReceipt({
    hash: fissionHash,
  })
  const { isLoading: isFusionTx, isSuccess: isFusionSuccess } = useWaitForTransactionReceipt({
    hash: fusionHash,
  })
  const {
    isLoading: isProtonToNeutronTx,
    isSuccess: isProtonToNeutronSuccess,
  } = useWaitForTransactionReceipt({
    hash: protonToNeutronHash,
  })
  const {
    isLoading: isNeutronToProtonTx,
    isSuccess: isNeutronToProtonSuccess,
  } = useWaitForTransactionReceipt({
    hash: neutronToProtonHash,
  })

  useEffect(() => {
    if (
      isApproveSuccess ||
      isFissionSuccess ||
      isFusionSuccess ||
      isProtonToNeutronSuccess ||
      isNeutronToProtonSuccess
    ) {
      void refetchBaseBalance()
      void refetchNeutronBalance()
      void refetchProtonBalance()
      void refetchBaseAllowance()
      void refetchNativeBalance()
      void refetchReserve()
      void refetchNeutronTotalSupply()
      void refetchProtonTotalSupply()
      void refetchFissionFee()
      void refetchFusionFee()
      void refetchBaseToken()
      void refetchNeutronToken()
      void refetchProtonToken()

      if (
        isFissionSuccess ||
        isFusionSuccess ||
        isProtonToNeutronSuccess ||
        isNeutronToProtonSuccess
      ) {
        setAmount("")
      }
    }
  }, [
    isApproveSuccess,
    isFissionSuccess,
    isFusionSuccess,
    isProtonToNeutronSuccess,
    isNeutronToProtonSuccess,
    refetchBaseBalance,
    refetchNeutronBalance,
    refetchProtonBalance,
    refetchBaseAllowance,
    refetchNativeBalance,
    refetchReserve,
    refetchNeutronTotalSupply,
    refetchProtonTotalSupply,
    refetchFissionFee,
    refetchFusionFee,
    refetchBaseToken,
    refetchNeutronToken,
    refetchProtonToken,
  ])

  const vaultHeading =
    typeof vaultName === "string" && vaultName.trim().length > 0
      ? /reactor$/i.test(vaultName.trim())
        ? vaultName.trim()
        : `${vaultName.trim()} Reactor`
      : "StableCoin Reactor"

  useEffect(() => {
    if (isFissionSuccess) toast.success("Base converted into neutron + proton")
  }, [isFissionSuccess])

  useEffect(() => {
    if (isFusionSuccess) toast.success("Neutron + proton redeemed for base")
  }, [isFusionSuccess])

  useEffect(() => {
    if (isProtonToNeutronSuccess) toast.success("Proton successfully transmuted to neutron")
  }, [isProtonToNeutronSuccess])

  useEffect(() => {
    if (isNeutronToProtonSuccess) toast.success("Neutron successfully transmuted to proton")
  }, [isNeutronToProtonSuccess])

  const parsedAmountForApproval = useMemo(() => {
    if (baseDecimalsNumber === undefined) return null
    if (!amount) return null
    return safeParseUnits(amount, baseDecimalsNumber)
  }, [amount, baseDecimalsNumber])

  const needsApproval =
    route === "FISSION" &&
    !useNativeBase &&
    baseAllowance !== undefined &&
    parsedAmountForApproval !== null &&
    parsedAmountForApproval > (baseAllowance || 0n)

  const approvalSymbol = baseSymbolText

  const isProcessing =
    isApproving ||
    isApprovingTx ||
    isFissioning ||
    isFissionTx ||
    isFusing ||
    isFusionTx ||
    isNativeFlowProcessing ||
    isProtonToNeutronPending ||
    isProtonToNeutronTx ||
    isNeutronToProtonPending ||
    isNeutronToProtonTx

  const fromLabel = useMemo(() => {
    switch (fromToken) {
      case "BASE":
        return activeBaseSymbol
      case "NEUTRON":
        return neutronSymbolText
      case "PROTON":
        return protonSymbolText
      case "BUNDLE":
        return `${neutronSymbolText} + ${protonSymbolText}`
      default:
        return "Token"
    }
  }, [fromToken, activeBaseSymbol, neutronSymbolText, protonSymbolText])

  const toLabel = useMemo(() => {
    switch (toToken) {
      case "BASE":
        return activeBaseSymbol
      case "NEUTRON":
        return neutronSymbolText
      case "PROTON":
        return protonSymbolText
      case "BUNDLE":
        return `${neutronSymbolText} + ${protonSymbolText}`
      default:
        return "Token"
    }
  }, [toToken, activeBaseSymbol, neutronSymbolText, protonSymbolText])

  const handleApprove = () => {
    if (!writeApprove) return

    if (!baseToken) return

    if (baseDecimalsNumber === undefined) {
      toast.error("Base token decimals not available")
      return
    }

    const parsedAmount = parsedAmountForApproval

    if (parsedAmount === null) {
      toast.error("Invalid amount for approval")
      return
    }

    try {
      writeApprove({
        address: baseToken as `0x${string}`,
        abi: ERC20ABI,
        functionName: "approve",
        args: [
          reactorAddress as `0x${string}`,
          parsedAmount === 0n
            ? parseUnits("1000000", baseDecimalsNumber)
            : parsedAmount,
        ],
      })
    } catch (error) {
      console.error("Approve error:", error)
      toast.error("Failed to approve tokens")
    }
  }

  const waitForNativeReceipt = async (hash: `0x${string}`) => {
    if (!publicClient) {
      throw new Error("Public client is not available")
    }

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status !== "success") {
      throw new Error("Transaction reverted")
    }
  }

  const refreshAfterNativeFlow = () => {
    void refetchBaseBalance()
    void refetchNeutronBalance()
    void refetchProtonBalance()
    void refetchBaseAllowance()
    void refetchNativeBalance()
    void refetchReserve()
    void refetchNeutronTotalSupply()
    void refetchProtonTotalSupply()
    void refetchFissionFee()
    void refetchFusionFee()
    void refetchBaseToken()
    void refetchNeutronToken()
    void refetchProtonToken()
  }

  const handleSwap = async () => {
    if (!route) {
      toast.error("Unsupported conversion path")
      return
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount")
      return
    }

    if (!recipient || !recipient.startsWith("0x")) {
      toast.error("Enter a valid recipient address")
      return
    }

    try {
      switch (route) {
        case "FISSION": {
          if (useNativeBase) {
            if (!nativeAsset || !address || !publicClient) {
              toast.error("Native asset support is not available for this reactor")
              return
            }

            const parsedNative = safeParseUnits(amount, nativeAsset.nativeDecimals)
            if (parsedNative === null || parsedNative <= 0n) {
              toast.error("Invalid native amount")
              return
            }

            setIsNativeFlowProcessing(true)
            let wrapSubmitted = false
            let wrapCompleted = false
            let fissionSubmitted = false

            try {
              // 1. Wrap the native asset in the user's wallet.
              const wrapHash = await writeNativeContract({
                address: nativeAsset.wrappedNativeAddress,
                abi: WrappedNativeABI,
                functionName: "deposit",
                value: parsedNative,
              })
              wrapSubmitted = true
              await waitForNativeReceipt(wrapHash)
              wrapCompleted = true

              // 2. Approve only when the Reactor allowance is insufficient.
              if (parsedNative > (baseAllowance || 0n)) {
                const approveWrappedHash = await writeNativeContract({
                  address: nativeAsset.wrappedNativeAddress,
                  abi: ERC20ABI,
                  functionName: "approve",
                  args: [
                    reactorAddress as `0x${string}`,
                    parsedNative,
                  ],
                })
                await waitForNativeReceipt(approveWrappedHash)
              }

              // 3. Use the existing Reactor fission path.
              const nativeFissionHash = await writeNativeContract({
                address: reactorAddress as `0x${string}`,
                abi: StableCoinReactorABI,
                functionName: "fission",
                args: [
                  parsedNative,
                  recipient as `0x${string}`,
                ],
              })
              fissionSubmitted = true
              await waitForNativeReceipt(nativeFissionHash)

              refreshAfterNativeFlow()
              setAmount("")
              toast.success(
                `${nativeAsset.nativeSymbol} converted into neutron + proton`,
              )
            } catch (error) {
              console.error("Native fission error:", error)
              refreshAfterNativeFlow()

              if (fissionSubmitted) {
                // The transaction may have been mined even if receipt polling
                // failed. Do not leave the same amount ready for another
                // fission attempt.
                setAmount("")
                toast.error(
                  "Fission was submitted but its final status could not be confirmed. Check your wallet or explorer before retrying.",
                )
              } else if (wrapCompleted) {
                // Do not wrap the same native amount again on retry.
                // Continue through the ordinary wrapped-base flow instead.
                setUseNativeBase(false)
                toast.error(
                  `${nativeAsset.nativeSymbol} was wrapped successfully, but fission did not finish. Continue from the wrapped base-asset mode.`,
                )
              } else if (wrapSubmitted) {
                setUseNativeBase(false)
                toast.error(
                  "The wrap transaction was submitted but its final status could not be confirmed. Check your wallet before retrying.",
                )
              } else {
                toast.error("Native fission did not complete")
              }
            } finally {
              setIsNativeFlowProcessing(false)
            }

            return
          }

          if (baseDecimalsNumber === undefined) {
            toast.error("Base token decimals not available yet")
            return
          }

          const parsed = safeParseUnits(amount, baseDecimalsNumber)
          if (parsed === null) {
            toast.error("Invalid base amount")
            return
          }

          await writeFission({
            address: reactorAddress as `0x${string}`,
            abi: StableCoinReactorABI,
            functionName: "fission",
            args: [parsed, recipient as `0x${string}`],
          })
          break
        }
        case "FUSION": {
          if (baseDecimalsNumber === undefined) {
            toast.error("Base token decimals not available yet")
            return
          }

          const parsedFusionAmount = safeParseUnits(amount, baseDecimalsNumber)

          if (parsedFusionAmount === null || parsedFusionAmount <= 0n) {
            toast.error("Invalid fusion amount")
            return
          }

          if (useNativeBase) {
            if (
              !nativeAsset ||
              !address ||
              !publicClient ||
              fusionGrossBaseRaw === null ||
              fusionFee === undefined
            ) {
              toast.error("Native fusion is not available")
              return
            }

            const fee = mulDiv(fusionGrossBaseRaw, fusionFee, WAD)
            const nativeOut = fusionGrossBaseRaw - fee

            if (nativeOut < parsedFusionAmount) {
              toast.error("Unable to calculate native fusion output")
              return
            }

            setIsNativeFlowProcessing(true)
            let fusionSubmitted = false
            let fusionCompleted = false
            let unwrapSubmitted = false
            let unwrapCompleted = false
            let transferSubmitted = false

            try {
              // 1. Redeem through the existing Reactor. The wrapped-native
              // output must first return to the connected wallet so that the
              // wallet can unwrap it without a helper contract.
              const nativeFusionHash = await writeNativeContract({
                address: reactorAddress as `0x${string}`,
                abi: StableCoinReactorABI,
                functionName: "fusion",
                args: [
                  fusionGrossBaseRaw,
                  address,
                ],
              })
              fusionSubmitted = true
              await waitForNativeReceipt(nativeFusionHash)
              fusionCompleted = true

              // 2. Unwrap exactly the amount produced by fusion.
              const unwrapHash = await writeNativeContract({
                address: nativeAsset.wrappedNativeAddress,
                abi: WrappedNativeABI,
                functionName: "withdraw",
                args: [nativeOut],
              })
              unwrapSubmitted = true
              await waitForNativeReceipt(unwrapHash)
              unwrapCompleted = true

              // 3. If a different recipient was requested, forward the native
              // asset from the user's wallet after the unwrap.
              if (!addressesEqual(recipient, address)) {
                const transferHash = await sendNativeTransaction({
                  to: recipient as `0x${string}`,
                  value: nativeOut,
                })
                transferSubmitted = true
                await waitForNativeReceipt(transferHash)
              }

              refreshAfterNativeFlow()
              setAmount("")
              toast.success(
                `Neutron + proton redeemed for ${nativeAsset.nativeSymbol}`,
              )
            } catch (error) {
              console.error("Native fusion error:", error)
              refreshAfterNativeFlow()

              if (fusionSubmitted) {
                // Once fusion has been submitted, do not leave the same amount
                // ready for another burn while its status may be uncertain.
                setAmount("")

                if (!fusionCompleted) {
                  toast.error(
                    "Fusion was submitted but its final status could not be confirmed. Check your wallet or explorer before retrying.",
                  )
                } else if (!unwrapCompleted) {
                  toast.error(
                    unwrapSubmitted
                      ? "Fusion succeeded and unwrap was submitted, but its final status could not be confirmed. Check your wallet before taking another action."
                      : "Fusion succeeded, but unwrap did not. The wrapped native asset remains in your wallet.",
                  )
                } else if (
                  !addressesEqual(recipient, address) &&
                  transferSubmitted
                ) {
                  toast.error(
                    `The final ${nativeAsset.nativeSymbol} transfer was submitted but its status could not be confirmed. Check the recipient before retrying.`,
                  )
                } else {
                  toast.error(
                    `Fusion and unwrap succeeded, but the final ${nativeAsset.nativeSymbol} transfer did not. The native asset remains in your wallet.`,
                  )
                }
              } else {
                toast.error("Native fusion did not complete")
              }
            } finally {
              setIsNativeFlowProcessing(false)
            }

            return
          }

          await writeFusion({
            address: reactorAddress as `0x${string}`,
            abi: StableCoinReactorABI,
            functionName: "fusion",
            args: [
              parsedFusionAmount,
              recipient as `0x${string}`,
            ],
          })

          break
        }
        case "PROTON_TO_NEUTRON": {
          if (protonDecimalsNumber === undefined) {
            toast.error("Proton token decimals not available")
            return
          }

          const parsed = safeParseUnits(amount, protonDecimalsNumber)
          if (parsed === null) {
            toast.error("Invalid proton amount")
            return
          }

          await writeProtonToNeutron({
            address: reactorAddress as `0x${string}`,
            abi: StableCoinReactorABI,
            functionName: "transmuteProtonToNeutron",
            args: [parsed, recipient as `0x${string}`],
          })
          break
        }
        case "NEUTRON_TO_PROTON": {
          if (neutronDecimalsNumber === undefined) {
            toast.error("Neutron token decimals not available")
            return
          }

          const parsed = safeParseUnits(amount, neutronDecimalsNumber)
          if (parsed === null) {
            toast.error("Invalid neutron amount")
            return
          }

          await writeNeutronToProton({
            address: reactorAddress as `0x${string}`,
            abi: StableCoinReactorABI,
            functionName: "transmuteNeutronToProton",
            args: [parsed, recipient as `0x${string}`],
          })
          break
        }
        default:
          toast.error("Unsupported conversion path")
      }
    } catch (error) {
      console.error("Swap execution error:", error)
      toast.error("Transaction failed to send")
    }
  }

  const disabledTokens: Record<TokenOption, boolean> = {
    BASE: !baseToken,
    BUNDLE: !neutronToken || !protonToken,
    NEUTRON: !neutronToken,
    PROTON: !protonToken,
  }

  const fromBalanceDisplay = useMemo(() => {
    switch (fromToken) {
      case "BASE":
        if (useNativeBase && nativeBalance) {
          return formatBalance(nativeBalance.value, nativeBalance.decimals)
        }
        return formatBalance(baseBalance, baseDecimalsNumber)
      case "NEUTRON":
        return formatBalance(neutronBalance, neutronDecimalsNumber)
      case "PROTON":
        return formatBalance(protonBalance, protonDecimalsNumber)
      case "BUNDLE":
        return `${neutronSymbolText}: ${formatBalance(
          neutronBalance,
          neutronDecimalsNumber,
        )} · ${protonSymbolText}: ${formatBalance(
          protonBalance,
          protonDecimalsNumber,
        )}`
      default:
        return "0"
    }
  }, [
    fromToken,
    baseBalance,
    nativeBalance,
    useNativeBase,
    neutronBalance,
    protonBalance,
    baseDecimalsNumber,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    neutronSymbolText,
    protonSymbolText,
  ])

  const swapDescription = useMemo(() => {
    switch (route) {
      case "FISSION":
        return `Convert ${activeBaseSymbol} into ${neutronSymbolText} + ${protonSymbolText}.`
      case "FUSION":
        return `Redeem ${neutronSymbolText} + ${protonSymbolText} back into ${activeBaseSymbol}.`
      case "PROTON_TO_NEUTRON":
        return `Transmute ${protonSymbolText} into ${neutronSymbolText} using the β⁺ pathway.`
      case "NEUTRON_TO_PROTON":
        return `Transmute ${neutronSymbolText} into ${protonSymbolText} using the β⁻ pathway.`
      default:
        return "Select a supported conversion pair to continue."
    }
  }, [route, activeBaseSymbol, neutronSymbolText, protonSymbolText])

  const actionLabel = useMemo(() => {
    switch (route) {
      case "FISSION":
        return useNativeBase && nativeAsset
          ? `Split ${nativeAsset.nativeSymbol}`
          : "Split Base"
      case "FUSION":
        return useNativeBase && nativeAsset
          ? `Redeem ${nativeAsset.nativeSymbol}`
          : "Merge Tokens"
      case "PROTON_TO_NEUTRON":
        return "Transmute β⁺"
      case "NEUTRON_TO_PROTON":
        return "Transmute β⁻"
      default:
        return "Select Pair"
    }
  }, [route, useNativeBase, nativeAsset])

  const handleMaxClick = () => {
    if (
      fromToken === "BASE" &&
      !useNativeBase &&
      baseBalance &&
      baseDecimalsNumber !== undefined
    ) {
      const formatted = formatUnits(baseBalance, baseDecimalsNumber)
      setAmount(trimFormattedAmount(formatted, 6))
    } else if (fromToken === "NEUTRON" && neutronBalance && neutronDecimalsNumber !== undefined) {
      const formatted = formatUnits(neutronBalance, neutronDecimalsNumber)
      setAmount(trimFormattedAmount(formatted, 6))
    } else if (fromToken === "PROTON" && protonBalance && protonDecimalsNumber !== undefined) {
      const formatted = formatUnits(protonBalance, protonDecimalsNumber)
      setAmount(trimFormattedAmount(formatted, 6))
    }
  }

  const renderMaxButton =
    (fromToken === "BASE" && !useNativeBase) ||
    fromToken === "NEUTRON" ||
    fromToken === "PROTON"

  const parsedProtonAmount = useMemo(() => {
    if (route !== "PROTON_TO_NEUTRON") return null
    if (!protonDecimalsNumber) return null
    if (!amount) return null
    return safeParseUnits(amount, protonDecimalsNumber)
  }, [route, amount, protonDecimalsNumber])

  const parsedNeutronAmount = useMemo(() => {
    if (route !== "NEUTRON_TO_PROTON") return null
    if (!neutronDecimalsNumber) return null
    if (!amount) return null
    return safeParseUnits(amount, neutronDecimalsNumber)
  }, [route, amount, neutronDecimalsNumber])

  const isFissionRoute = route === "FISSION"
  const isFusionRoute = route === "FUSION"
  const fissionBreakdown = useMemo(() => {
    if (!isFissionRoute) return null
    if (!baseAmountRaw || baseAmountRaw <= 0n) return null
    if (fissionFee === undefined || reserve === undefined) {
      return null
    }

    const fee = mulDiv(baseAmountRaw, fissionFee, WAD)
    const netBase = baseAmountRaw - fee
    if (netBase <= 0n) {
      return {
        baseIn: baseAmountRaw,
        fee,
        netBase,
        neutronOut: 0n,
        protonOut: 0n,
      }
    }

    if (
      baseDecimalsNumber === undefined ||
      neutronDecimalsNumber === undefined ||
      protonDecimalsNumber === undefined
    ) {
      return {
        baseIn: baseAmountRaw,
        fee,
        netBase,
        neutronOut: 0n,
        protonOut: 0n,
      }
    }

    const baseScale = pow10(baseDecimalsNumber)
    const netWad = mulDiv(netBase, WAD, baseScale)
    const bootstrap =
      reserve === 0n &&
      (neutronTotalSupply === undefined || neutronTotalSupply === 0n) &&
      (protonTotalSupply === undefined || protonTotalSupply === 0n)

    if (bootstrap) {
      if (basePricePegged === undefined) {
        return {
          baseIn: baseAmountRaw,
          fee,
          netBase,
          neutronOut: 0n,
          protonOut: 0n,
        }
      }

      const depositValueWad = mulDiv(netWad, basePricePegged, WAD)
      if (depositValueWad === 0n) {
        return {
          baseIn: baseAmountRaw,
          fee,
          netBase,
          neutronOut: 0n,
          protonOut: 0n,
        }
      }

      const neutronValueWad = depositValueWad / 3n
      if (neutronValueWad === 0n) {
        return {
          baseIn: baseAmountRaw,
          fee,
          netBase,
          neutronOut: 0n,
          protonOut: 0n,
        }
      }

      const baseForNeutronWad = mulDiv(neutronValueWad, WAD, basePricePegged)
      if (baseForNeutronWad === 0n || baseForNeutronWad >= netWad) {
        return {
          baseIn: baseAmountRaw,
          fee,
          netBase,
          neutronOut: 0n,
          protonOut: 0n,
        }
      }

      const protonBaseWad = netWad - baseForNeutronWad
      if (protonBaseWad === 0n) {
        return {
          baseIn: baseAmountRaw,
          fee,
          netBase,
          neutronOut: 0n,
          protonOut: 0n,
        }
      }

      const neutronOut = mulDiv(neutronValueWad, pow10(neutronDecimalsNumber), WAD)
      const protonOut = mulDiv(protonBaseWad, pow10(protonDecimalsNumber), WAD)

      return {
        baseIn: baseAmountRaw,
        fee,
        netBase,
        neutronOut,
        protonOut,
        basePriceWad: basePricePegged,
      }
    }

    if (!reserveWad || reserveWad === 0n || !neutronSupplyWad || !protonSupplyWad) {
      return null
    }

    const neutronOutWad =
      neutronSupplyWad === 0n ? 0n : mulDiv(netWad, neutronSupplyWad, reserveWad)
    const protonOutWad =
      protonSupplyWad === 0n ? 0n : mulDiv(netWad, protonSupplyWad, reserveWad)

    const neutronOut = mulDiv(neutronOutWad, pow10(neutronDecimalsNumber), WAD)
    const protonOut = mulDiv(protonOutWad, pow10(protonDecimalsNumber), WAD)

    return {
      baseIn: baseAmountRaw,
      fee,
      netBase,
      neutronOut,
      protonOut,
    }
  }, [
    isFissionRoute,
    baseAmountRaw,
    fissionFee,
    reserve,
    baseDecimalsNumber,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    neutronTotalSupply,
    protonTotalSupply,
    basePricePegged,
    reserveWad,
    neutronSupplyWad,
    protonSupplyWad,
  ])

  const displayFusionBreakdown = useMemo(() => {
    if (!isFusionRoute) return null
    if (!baseAmountRaw || baseAmountRaw <= 0n) return null
    if (fusionFee === undefined) return null

    const grossBase =
      useNativeBase ? fusionGrossBaseRaw : baseAmountRaw

    if (!grossBase || grossBase <= 0n) return null

    const fee = mulDiv(grossBase, fusionFee, WAD)
    const netBase = grossBase - fee

    // Burn amounts are displayed from the current Reactor state. The Reactor
    // remains authoritative and computes the exact burns at execution time.
    if (
      reserve === undefined ||
      reserve === 0n ||
      neutronTotalSupply === undefined ||
      protonTotalSupply === undefined ||
      baseDecimalsNumber === undefined ||
      neutronDecimalsNumber === undefined ||
      protonDecimalsNumber === undefined
    ) {
      return null
    }

    if (!reserveWad || reserveWad === 0n) return null
    if (!neutronSupplyWad || !protonSupplyWad) return null

    const baseScale = pow10(baseDecimalsNumber)
    const grossBaseWad = mulDiv(grossBase, WAD, baseScale)

    const neutronBurnWad = mulDiv(
      grossBaseWad,
      neutronSupplyWad,
      reserveWad,
    )

    const protonBurnWad = mulDiv(
      grossBaseWad,
      protonSupplyWad,
      reserveWad,
    )

    const neutronBurn = mulDiv(
      neutronBurnWad,
      pow10(neutronDecimalsNumber),
      WAD,
    )

    const protonBurn = mulDiv(
      protonBurnWad,
      pow10(protonDecimalsNumber),
      WAD,
    )

    return {
      requestedBaseOut: baseAmountRaw,
      grossBase,
      fee,
      netBase,
      neutronBurn,
      protonBurn,
    }
  }, [
    isFusionRoute,
    baseAmountRaw,
    fusionGrossBaseRaw,
    fusionFee,
    useNativeBase,
    reserve,
    neutronTotalSupply,
    protonTotalSupply,
    baseDecimalsNumber,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    reserveWad,
    neutronSupplyWad,
    protonSupplyWad,
  ])

  const fromBreakdownRows = useMemo(() => {
    if (isFusionRoute && displayFusionBreakdown) {
      return [
        {
          label: neutronSymbolText,
          value: formatTokenValue(displayFusionBreakdown.neutronBurn, neutronDecimalsNumber, neutronSymbolText),
        },
        {
          label: protonSymbolText,
          value: formatTokenValue(displayFusionBreakdown.protonBurn, protonDecimalsNumber, protonSymbolText),
        },
      ]
    }
    return []
  }, [
    isFusionRoute,
    displayFusionBreakdown,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    neutronSymbolText,
    protonSymbolText,
  ])

  const fusionBundleSummary = useMemo(() => {
    if (!isFusionRoute) return ""
    if (!fromBreakdownRows.length) return ""
    return fromBreakdownRows.map((row) => row.value).join(" + ")
  }, [isFusionRoute, fromBreakdownRows])

  const breakdownPopover = useMemo(() => {
    if (isFissionRoute && fissionBreakdown) {
      return {
        title: "Fission breakdown",
        rows: [
          {
            label: "Base supplied",
            value: formatTokenValue(fissionBreakdown.baseIn, baseDecimalsNumber, baseSymbolText),
          },
          {
            label: "Fee retained",
            value: formatTokenValue(fissionBreakdown.fee, baseDecimalsNumber, baseSymbolText),
          },
          {
            label: "Net base",
            value: formatTokenValue(fissionBreakdown.netBase, baseDecimalsNumber, baseSymbolText),
          },
          {
            label: `Mint ${neutronSymbolText}`,
            value: formatTokenValue(fissionBreakdown.neutronOut, neutronDecimalsNumber, neutronSymbolText),
          },
          {
            label: `Mint ${protonSymbolText}`,
            value: formatTokenValue(fissionBreakdown.protonOut, protonDecimalsNumber, protonSymbolText),
          },
          {
            label: "Oracle price",
            value: (() => {
              const oraclePriceWad = fissionBreakdown.basePriceWad ?? basePricePegged
              return oraclePriceWad
                ? `${formatWad(oraclePriceWad)} ${peggedSymbolText}/${baseSymbolText}`
                : "—"
            })(),
          },
        ],
      }
    }

    if (isFusionRoute && displayFusionBreakdown) {
      return {
        title: "Fusion breakdown",
        rows: [
          {
            label: "Base requested",
            value: formatTokenValue(
              displayFusionBreakdown.requestedBaseOut,
              baseDecimalsNumber,
              activeBaseSymbol,
            ),
          },
          {
            label: "Gross base",
            value: formatTokenValue(displayFusionBreakdown.grossBase, baseDecimalsNumber, activeBaseSymbol),
          },
          {
            label: "Fee withheld",
            value: formatTokenValue(displayFusionBreakdown.fee, baseDecimalsNumber, activeBaseSymbol),
          },
          {
            label: `Burn ${neutronSymbolText}`,
            value: formatTokenValue(displayFusionBreakdown.neutronBurn, neutronDecimalsNumber, neutronSymbolText),
          },
          {
            label: `Burn ${protonSymbolText}`,
            value: formatTokenValue(displayFusionBreakdown.protonBurn, protonDecimalsNumber, protonSymbolText),
          },
        ],
      }
    }

    return null
  }, [
    isFissionRoute,
    fissionBreakdown,
    baseDecimalsNumber,
    baseSymbolText,
    activeBaseSymbol,
    neutronSymbolText,
    neutronDecimalsNumber,
    protonSymbolText,
    protonDecimalsNumber,
    basePricePegged,
    peggedSymbolText,
    isFusionRoute,
    displayFusionBreakdown,
  ])

  const fissionMintSummary = useMemo(() => {
    if (!isFissionRoute || !fissionBreakdown) return ""
    const neutronText = formatTokenValue(
      fissionBreakdown.neutronOut,
      neutronDecimalsNumber,
      neutronSymbolText,
      4,
    )
    const protonText = formatTokenValue(
      fissionBreakdown.protonOut,
      protonDecimalsNumber,
      protonSymbolText,
      4,
    )
    return `${neutronText} + ${protonText}`
  }, [
    isFissionRoute,
    fissionBreakdown,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    neutronSymbolText,
    protonSymbolText,
  ])

  const protonToNeutronSummary = useMemo(() => {
    if (route !== "PROTON_TO_NEUTRON") return ""
    if (!parsedProtonAmount || parsedProtonAmount <= 0n) return ""
    if (!protonPriceInBase || !neutronPriceInBase) return ""
    if (!neutronDecimalsNumber) return ""
    const grossBase = mulDiv(parsedProtonAmount, protonPriceInBase, WAD)
    if (grossBase === 0n) return ""
    const neutronOut = mulDiv(grossBase, WAD, neutronPriceInBase)
    if (neutronOut === 0n) return ""
    return formatTokenValue(neutronOut, neutronDecimalsNumber, neutronSymbolText, 4)
  }, [
    route,
    parsedProtonAmount,
    protonPriceInBase,
    neutronPriceInBase,
    neutronDecimalsNumber,
    neutronSymbolText,
  ])

  const neutronToProtonSummary = useMemo(() => {
    if (route !== "NEUTRON_TO_PROTON") return ""
    if (!parsedNeutronAmount || parsedNeutronAmount <= 0n) return ""
    if (!neutronPriceInBase || !protonPriceInBase) return ""
    if (!protonDecimalsNumber) return ""
    const grossBase = mulDiv(parsedNeutronAmount, neutronPriceInBase, WAD)
    if (grossBase === 0n) return ""
    const protonOut = mulDiv(grossBase, WAD, protonPriceInBase)
    if (protonOut === 0n) return ""
    return formatTokenValue(protonOut, protonDecimalsNumber, protonSymbolText, 4)
  }, [
    route,
    parsedNeutronAmount,
    neutronPriceInBase,
    protonPriceInBase,
    protonDecimalsNumber,
    protonSymbolText,
  ])

  const fromInputReadOnly = isFusionRoute
  const fromInputType = isFusionRoute ? "text" : "number"
  const fromInputValue = isFusionRoute ? fusionBundleSummary : amount
  const fromInputPlaceholder = isFusionRoute
    ? fusionBundleSummary || `${neutronSymbolText} + ${protonSymbolText} burn calculated automatically`
    : "0.0"

  const toInputReadOnly = !isFusionRoute
  const toInputType = isFusionRoute ? "number" : "text"
  const toInputValue = useMemo(() => {
    if (isFusionRoute) return amount
    if (isFissionRoute && fissionMintSummary) return fissionMintSummary
    if (route === "PROTON_TO_NEUTRON") return protonToNeutronSummary
    if (route === "NEUTRON_TO_PROTON") return neutronToProtonSummary
    return ""
  }, [
    isFusionRoute,
    amount,
    isFissionRoute,
    fissionMintSummary,
    route,
    protonToNeutronSummary,
    neutronToProtonSummary,
  ])

  const toInputPlaceholder = useMemo(() => {
    if (isFusionRoute) {
      return `Enter the amount of ${activeBaseSymbol} you want back`
    }
    if (isFissionRoute) {
      return fissionMintSummary || "Minted bundle appears here"
    }
    if (route === "PROTON_TO_NEUTRON") {
      return protonToNeutronSummary || `Minted ${neutronSymbolText} appears here`
    }
    if (route === "NEUTRON_TO_PROTON") {
      return neutronToProtonSummary || `Minted ${protonSymbolText} appears here`
    }
    return "Calculated on-chain"
  }, [
    isFusionRoute,
    activeBaseSymbol,
    isFissionRoute,
    fissionMintSummary,
    route,
    protonToNeutronSummary,
    neutronToProtonSummary,
    neutronSymbolText,
    protonSymbolText,
  ])

  const treasuryAddress = typeof treasury === "string" ? treasury : undefined
  const oracleAddressText = typeof oracleAddress === "string" ? oracleAddress : undefined
  const baseTokenAddress = typeof baseToken === "string" ? baseToken : undefined

  const reserveBalanceText =
    reserve && baseDecimalsNumber !== undefined
      ? `${formatBalance(reserve, baseDecimalsNumber)} ${baseSymbolText}`
      : "—"
  const neutronSupplyText =
    neutronTotalSupply !== undefined && neutronDecimalsNumber !== undefined
      ? formatBalance(neutronTotalSupply, neutronDecimalsNumber)
      : "—"
  const protonSupplyText =
    protonTotalSupply !== undefined && protonDecimalsNumber !== undefined
      ? formatBalance(protonTotalSupply, protonDecimalsNumber)
      : "—"
  const neutronBasePriceText =
    neutronPriceInBase !== undefined
      ? `${formatWad(neutronPriceInBase)} ${baseSymbolText}`
      : "—"
  const protonBasePriceText =
    protonPriceInBase !== undefined
      ? `${formatWad(protonPriceInBase)} ${baseSymbolText}`
      : "—"
  const neutronPegPriceText =
    neutronPricePegged !== undefined
      ? `${formatWad(neutronPricePegged)} ${peggedSymbolText}`
      : "—"
  const protonPegPriceText =
    protonPricePegged !== undefined
      ? `${formatWad(protonPricePegged)} ${peggedSymbolText}`
      : "—"
  const bundleLabel = `${neutronSymbolText} + ${protonSymbolText}`

  const handleCopy = async (value?: string) => {
    if (!value || value === "—") {
      toast.error("Nothing to copy")
      return
    }
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard unavailable in this environment")
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
      toast.success("Copied to clipboard")
      setTimeout(() => {
        setCopiedValue((current) => (current === value ? null : current))
      }, 1800)
    } catch (error) {
      console.error("Copy failed:", error)
      toast.error("Failed to copy value")
    }
  }

  const infoSections = useMemo<InfoSection[]>(() => {
    const sections: InfoSection[] = []

    sections.push({
      title: "Vault Posture",
      description: "Core reserve state and fee policy for this reactor.",
      items: [
        { label: "Reserve Balance", value: reserveBalanceText, emphasize: true },
        { label: "Reserve Ratio", value: reserveRatioText },
        { label: "Critical Ratio", value: criticalRatioText },
        { label: "Base/Peg Price", value: basePricePeggedText },
        { label: "Fission Fee", value: fissionFeeText },
        { label: "Fusion Fee", value: fusionFeeText },
        { label: "Base Asset", value: baseAssetDisplay },
        { label: "Pegged Asset", value: peggedAssetDisplay },
      ],
    })

    sections.push({
      title: "Program Addresses",
      description: "Key accounts that control this vault.",
      items: [
        { label: "Vault Address", value: reactorAddress ?? "—", monospace: true },
        { label: "Treasury", value: treasuryAddress ?? "—", monospace: true },
        { label: "Oracle", value: oracleAddressText ?? "—", monospace: true },
        { label: "Base Token", value: baseTokenAddress ?? "—", monospace: true },
      ],
    })

    sections.push({
      title: `${neutronSymbolText} Metrics`,
      description: "Stable asset supply and price snapshots.",
      items: [
        { label: "Supply", value: neutronSupplyText, emphasize: true },
        { label: `${neutronSymbolText}/${baseSymbolText}`, value: neutronBasePriceText },
        { label: `${neutronSymbolText}/${peggedSymbolText}`, value: neutronPegPriceText },
      ],
    })

    sections.push({
      title: `${protonSymbolText} Metrics`,
      description: "Volatile asset issuance and pricing context.",
      items: [
        { label: "Supply", value: protonSupplyText, emphasize: true },
        { label: `${protonSymbolText}/${baseSymbolText}`, value: protonBasePriceText },
        { label: `${protonSymbolText}/${peggedSymbolText}`, value: protonPegPriceText },
      ],
    })

    return sections
  }, [
    reactorAddress,
    treasuryAddress,
    oracleAddressText,
    baseTokenAddress,
    reserveBalanceText,
    reserveRatioText,
    criticalRatioText,
    fissionFeeText,
    fusionFeeText,
    baseAssetDisplay,
    peggedAssetDisplay,
    basePricePeggedText,
    neutronSupplyText,
    protonSupplyText,
    neutronBasePriceText,
    protonBasePriceText,
    neutronPegPriceText,
    protonPegPriceText,
    neutronSymbolText,
    protonSymbolText,
    baseSymbolText,
    peggedSymbolText,
  ])




  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container-page py-10 sm:py-14">
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

        <div className="mx-auto max-w-2xl">
          <Card className="rounded-2xl border border-border bg-card">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                Swap Anywhere, Anytime
              </CardTitle>
              <p className="text-sm text-muted-foreground">{swapDescription}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {nativeAsset && (route === "FISSION" || route === "FUSION") && (
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      Base asset mode
                    </span>
                    <span className="text-xs font-mono text-foreground/70">
                      {useNativeBase
                        ? nativeAsset.nativeSymbol
                        : baseSymbolText}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={useNativeBase ? "outline" : "default"}
                      aria-pressed={!useNativeBase}
                      onClick={() => setUseNativeBase(false)}
                    >
                      {baseSymbolText}
                    </Button>

                    <Button
                      type="button"
                      variant={useNativeBase ? "default" : "outline"}
                      aria-pressed={useNativeBase}
                      onClick={() => setUseNativeBase(true)}
                    >
                      {nativeAsset.nativeSymbol} (native)
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-3 rounded-xl border border-border bg-background p-4 sm:p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>From</span>
                  <span className="font-mono text-xs text-foreground/80">{fromBalanceDisplay}</span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:h-14">
                  <Select value={fromToken} onValueChange={(value) => setFromToken(value as TokenOption)}>
                    <SelectTrigger className="h-12 sm:h-14 w-full sm:w-48 sm:flex-none bg-background/80">
                      <SelectValue placeholder="Token" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASE" disabled={disabledTokens.BASE}>
                        {useNativeBase && nativeAsset
                          ? `${nativeAsset.nativeSymbol} (native)`
                          : `${baseAssetName} (${baseSymbolText})`}
                      </SelectItem>
                      <SelectItem value="NEUTRON" disabled={disabledTokens.NEUTRON}>
                        {neutronSymbolText}
                      </SelectItem>
                      <SelectItem value="PROTON" disabled={disabledTokens.PROTON}>
                        {protonSymbolText}
                      </SelectItem>
                      <SelectItem value="BUNDLE" disabled={disabledTokens.BUNDLE}>
                        {`${neutronSymbolText} + ${protonSymbolText}`}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type={fromInputType}
                    placeholder={fromInputPlaceholder}
                    value={fromInputValue}
                    onChange={(event) => {
                      if (fromInputReadOnly) return
                      setAmount(event.target.value)
                    }}
                    readOnly={fromInputReadOnly}
                    className="w-full sm:flex-1 sm:min-w-0 text-xl sm:text-2xl font-semibold h-12 sm:h-14 bg-background/60"
                  />

                  {renderMaxButton && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto h-12 sm:h-14 border-border hover:bg-muted"
                      onClick={handleMaxClick}
                    >
                      Max
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Reverse conversion direction"
                  className="size-11 rounded-full border border-border bg-background p-0 hover:bg-secondary"
                  onClick={() => {
                    const newFrom = toToken
                    const newTo = allowedTargets[newFrom][0]
                    setFromToken(newFrom)
                    setToToken(newTo)
                  }}
                >
                  <ArrowLeftRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-background p-4 sm:p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>To</span>
                  <div className="flex items-center gap-2">
                    {breakdownPopover && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="rounded-lg border border-border p-1 text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 space-y-2 text-sm" align="end">
                          <p className="font-semibold text-foreground/90">{breakdownPopover.title}</p>
                          <div className="space-y-1 font-mono text-xs">
                            {breakdownPopover.rows.map((row) => (
                              <div key={row.label} className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">{row.label}</span>
                                <span className="text-foreground">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                    <span className="font-mono text-xs text-foreground/80">{toLabel}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:h-14">
                  <Select value={toToken} onValueChange={(value) => setToToken(value as TokenOption)}>
                    <SelectTrigger className="h-12 sm:h-14 sm:w-52 sm:flex-none bg-background/80">
                      <SelectValue placeholder="Token" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTargets[fromToken].map((target) => (
                        <SelectItem key={target} value={target}>
                          {target === "BUNDLE"
                            ? bundleLabel
                            : target === "BASE"
                              ? activeBaseSymbol
                              : target === "NEUTRON"
                                ? neutronSymbolText
                                : protonSymbolText}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type={toInputType}
                    placeholder={toInputPlaceholder}
                    value={toInputValue}
                    onChange={(event) => {
                      if (!toInputReadOnly) {
                        setAmount(event.target.value)
                      }
                    }}
                    readOnly={toInputReadOnly}
                    className="w-full sm:flex-1 sm:min-w-0 text-xl sm:text-2xl font-semibold h-12 sm:h-14 bg-background/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Recipient Address</label>
                <Input
                  placeholder="0x..."
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  className="font-mono text-sm bg-background/60"
                />
              </div>

              <ConnectButton.Custom>
                {({ account, chain, openConnectModal, mounted }) => {
                  const ready = mounted
                  const connected = ready && account && chain

                  return (
                    <div
                      {...(!ready && {
                        "aria-hidden": true,
                        style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <Button
                              onClick={openConnectModal}
                              className="w-full h-12 sm:h-14 text-[15px]"
                            >
                              <Zap className="mr-2 h-5 w-5" />
                              Connect Wallet
                            </Button>
                          )
                        }

                        if (!route) {
                          return (
                            <Button disabled className="w-full h-12 sm:h-14 text-[15px] bg-secondary text-muted-foreground disabled:opacity-100">
                              Select a valid pair
                            </Button>
                          )
                        }

                        if (!amount || Number(amount) <= 0 || !recipient) {
                          return (
                            <Button
                              disabled
                              className="w-full h-12 sm:h-14 text-[15px] bg-secondary text-muted-foreground shadow-none disabled:opacity-100"
                            >
                              Enter amount and recipient
                            </Button>
                          )
                        }

                        if (needsApproval) {
                          return (
                            <Button
                              onClick={handleApprove}
                              disabled={isProcessing}
                              className="w-full h-12 sm:h-14 text-[15px]"
                            >
                              {isApproving || isApprovingTx ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                  Approving…
                                </>
                              ) : (
                                <>
                                  <Shield className="mr-2 h-5 w-5" />
                                  Approve {approvalSymbol}
                                </>
                              )}
                            </Button>
                          )
                        }

                        return (
                          <Button
                            onClick={handleSwap}
                            disabled={isProcessing}
                            className="w-full h-12 sm:h-14 text-[15px] disabled:opacity-60"
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                Processing…
                              </>
                            ) : (
                              actionLabel
                            )}
                          </Button>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>
            </CardContent>
          </Card>
        </div>

        {infoSections.length > 0 && (
          <div className="max-w-4xl mx-auto mt-16 sm:mt-24 lg:mt-40">
            <Card
              className="bg-background/50 border-white/40"
              style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-foreground">Reactor Parameters</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Live configuration, oracle wiring, and treasury context for this vault.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {infoSections.map((section) => (
                  <section
                    key={section.title}
                    className="rounded-xl border border-white/20 bg-white/5 px-5 py-6 backdrop-blur-sm"
                  >
                    <div className="flex min-h-[4rem] flex-col gap-1 border-b border-border/60 pb-4">
                      <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                      {section.description ? (
                        <p className="text-xs text-muted-foreground/80">{section.description}</p>
                      ) : null}
                    </div>
                    <dl className="divide-y divide-border/60">
                      {section.items.map((row) => {
                        const isCopyable = row.monospace && row.value !== "—"
                        const emphasisClasses = row.emphasize
                          ? "text-lg font-semibold tracking-tight"
                          : "text-sm"

                        return (
                          <div key={`${section.title}-${row.label}`} className="rounded-lg bg-white/[0.03] px-3 py-3">
                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</dt>
                            <dd
                              className={`mt-1 text-foreground ${emphasisClasses} ${
                                isCopyable ? "flex items-center gap-2" : ""
                              }`}
                            >
                              {isCopyable ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full border border-border bg-background hover:bg-muted"
                                    onClick={() => void handleCopy(row.value)}
                                  >
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy {row.label}</span>
                                  </Button>
                                  <div className="flex flex-col">
                                    <span className="font-mono text-xs sm:text-sm">
                                      {shortenAddress(row.value)}
                                    </span>
                                    {copiedValue === row.value ? (
                                      <span className="text-xs text-muted-foreground">
                                        Copied
                                      </span>
                                    ) : null}
                                  </div>
                                </>
                              ) : (
                                row.value
                              )}
                            </dd>
                          </div>
                        )
                      })}
                    </dl>
                  </section>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
