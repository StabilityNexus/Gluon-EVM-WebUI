import { useEffect } from "react"
import { useBalance, useReadContract } from "wagmi"
import { StableCoinReactorABI, ERC20ABI } from "@/utils/abi/StableCoin"
import { getGluonNetwork } from "@/utils/networks"
import { resolveNativeAssetConfig } from "@/utils/nativeAsset"
import type { InteractionContext } from "./interactionTypes"
import type { InteractionForm } from "./useInteractionForm"

type ReactorContractsInput = Pick<
  InteractionContext & InteractionForm,
  "address" | "chainId" | "setUseNativeBase" | "route" | "reactorAddress"
>

export function useReactorContracts({
  address,
  chainId,
  setUseNativeBase,
  route,
  reactorAddress,
}: ReactorContractsInput) {
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

  const { data: baseToken, refetch: refetchBaseToken } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "BASE_TOKEN",
  })

  const { data: baseDecimals } = useReadContract({
    address: baseToken as `0x${string}`,
    abi: ERC20ABI,
    functionName: "decimals",
    query: {
      enabled: !!baseToken,
    },
  })

  const baseDecimalsNumber =
    typeof baseDecimals === "number" ? baseDecimals : undefined

  const networkConfig = getGluonNetwork(chainId)
  const nativeAssetConfig = networkConfig?.nativeAsset

  const nativeAsset = resolveNativeAssetConfig(
    nativeAssetConfig,
    typeof baseToken === "string" ? baseToken : undefined,
    baseDecimalsNumber,
  )

  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
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
  }, [nativeAsset, route, setUseNativeBase])

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

  const { data: neutronToken, refetch: refetchNeutronToken } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "NEUTRON_TOKEN",
  })

  const { data: protonToken, refetch: refetchProtonToken } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "PROTON_TOKEN",
  })

  const { data: treasury } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "TREASURY",
  })

  const { data: fissionFee, refetch: refetchFissionFee } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "FISSION_FEE",
  })

  const { data: fusionFee, refetch: refetchFusionFee } = useReadContract({
    address: reactorAddress as `0x${string}`,
    abi: StableCoinReactorABI,
    functionName: "FUSION_FEE",
  })

  const { data: reserve, refetch: refetchReserve } = useReadContract({
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

  const { data: neutronTotalSupply, refetch: refetchNeutronTotalSupply } =
    useReadContract({
      address: neutronToken as `0x${string}`,
      abi: ERC20ABI,
      functionName: "totalSupply",
      query: {
        enabled: !!neutronToken,
      },
    })

  const { data: protonTotalSupply, refetch: refetchProtonTotalSupply } =
    useReadContract({
      address: protonToken as `0x${string}`,
      abi: ERC20ABI,
      functionName: "totalSupply",
      query: {
        enabled: !!protonToken,
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

  const { data: neutronBalance, refetch: refetchNeutronBalance } =
    useReadContract({
      address: neutronToken as `0x${string}`,
      abi: ERC20ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
      query: {
        enabled: !!address && !!neutronToken,
      },
    })

  const { data: protonBalance, refetch: refetchProtonBalance } =
    useReadContract({
      address: protonToken as `0x${string}`,
      abi: ERC20ABI,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
      query: {
        enabled: !!address && !!protonToken,
      },
    })

  const { data: baseAllowance, refetch: refetchBaseAllowance } =
    useReadContract({
      address: baseToken as `0x${string}`,
      abi: ERC20ABI,
      functionName: "allowance",
      args: [address as `0x${string}`, reactorAddress as `0x${string}`],
      query: {
        enabled: !!address && !!baseToken,
      },
    })

  const neutronDecimalsNumber =
    typeof neutronDecimals === "number"
      ? (neutronDecimals as number)
      : undefined
  const protonDecimalsNumber =
    typeof protonDecimals === "number" ? (protonDecimals as number) : undefined

  return {
    vaultName,
    oracleAddress,
    baseToken,
    refetchBaseToken,
    baseDecimalsNumber,
    nativeAsset,
    nativeBalance,
    refetchNativeBalance,
    baseAssetNameContract,
    baseAssetSymbolContract,
    peggedAssetNameContract,
    peggedAssetSymbolContract,
    neutronToken,
    refetchNeutronToken,
    protonToken,
    refetchProtonToken,
    treasury,
    fissionFee,
    refetchFissionFee,
    fusionFee,
    refetchFusionFee,
    reserve,
    refetchReserve,
    criticalReserveRatio,
    onChainBasePriceWad,
    neutronTotalSupply,
    refetchNeutronTotalSupply,
    protonTotalSupply,
    refetchProtonTotalSupply,
    baseSymbol,
    neutronSymbol,
    protonSymbol,
    baseBalance,
    refetchBaseBalance,
    neutronBalance,
    refetchNeutronBalance,
    protonBalance,
    refetchProtonBalance,
    baseAllowance,
    refetchBaseAllowance,
    neutronDecimalsNumber,
    protonDecimalsNumber,
  }
}

export type ReactorContracts = ReturnType<typeof useReactorContracts>
