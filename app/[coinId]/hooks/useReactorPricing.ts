import { useMemo } from "react"
import { maxUint256 } from "viem"
import { grossFusionAmountForNet } from "@/utils/nativeAsset"
import {
  formatPercentFromWad,
  safeParseUnits,
  WAD,
  mulDiv,
  scaleToWad,
  formatWad,
} from "../interactionUtils"
import type { InteractionForm } from "./useInteractionForm"
import type { ReactorContracts } from "./useReactorContracts"

type ReactorPricingInput = Pick<
  InteractionForm & ReactorContracts,
  | "amount"
  | "useNativeBase"
  | "route"
  | "baseDecimalsNumber"
  | "nativeAsset"
  | "baseAssetNameContract"
  | "baseAssetSymbolContract"
  | "peggedAssetNameContract"
  | "peggedAssetSymbolContract"
  | "fissionFee"
  | "fusionFee"
  | "reserve"
  | "criticalReserveRatio"
  | "onChainBasePriceWad"
  | "onChainReserveRatioWad"
  | "onChainNeutronPriceInBaseWad"
  | "onChainProtonPriceInBaseWad"
  | "neutronTotalSupply"
  | "protonTotalSupply"
  | "baseSymbol"
  | "neutronSymbol"
  | "protonSymbol"
  | "neutronDecimalsNumber"
  | "protonDecimalsNumber"
>

export function useReactorPricing({
  amount,
  useNativeBase,
  route,
  baseDecimalsNumber,
  nativeAsset,
  baseAssetNameContract,
  baseAssetSymbolContract,
  peggedAssetNameContract,
  peggedAssetSymbolContract,
  fissionFee,
  fusionFee,
  reserve,
  criticalReserveRatio,
  onChainBasePriceWad,
  onChainReserveRatioWad,
  onChainNeutronPriceInBaseWad,
  onChainProtonPriceInBaseWad,
  neutronTotalSupply,
  protonTotalSupply,
  baseSymbol,
  neutronSymbol,
  protonSymbol,
  neutronDecimalsNumber,
  protonDecimalsNumber,
}: ReactorPricingInput) {
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
  // Use the reactor's accounting, including alpha and its integer rounding.
  // An unavailable read stays unavailable rather than using a separate local model.
  const basePriceWad =
    typeof onChainBasePriceWad === "bigint" ? onChainBasePriceWad : undefined
  const neutronPriceInBase =
    typeof onChainNeutronPriceInBaseWad === "bigint"
      ? onChainNeutronPriceInBaseWad
      : undefined
  const protonPriceInBase =
    typeof onChainProtonPriceInBaseWad === "bigint"
      ? onChainProtonPriceInBaseWad
      : undefined
  const reserveRatio =
    typeof onChainReserveRatioWad === "bigint"
      ? onChainReserveRatioWad
      : undefined
  const neutronPricePegged = useMemo(() => {
    if (basePriceWad === undefined || neutronPriceInBase === undefined)
      return undefined
    return mulDiv(neutronPriceInBase, basePriceWad, WAD)
  }, [basePriceWad, neutronPriceInBase])
  const protonPricePegged = useMemo(() => {
    if (basePriceWad === undefined || protonPriceInBase === undefined)
      return undefined
    return mulDiv(protonPriceInBase, basePriceWad, WAD)
  }, [basePriceWad, protonPriceInBase])

  const baseSymbolText =
    typeof baseSymbol === "string" && baseSymbol.length > 0
      ? baseSymbol
      : typeof baseAssetSymbolContract === "string" &&
          baseAssetSymbolContract.length > 0
        ? baseAssetSymbolContract
        : "BASE"

  const activeBaseSymbol =
    useNativeBase && nativeAsset ? nativeAsset.nativeSymbol : baseSymbolText
  const baseAssetName =
    typeof baseAssetNameContract === "string" &&
    baseAssetNameContract.length > 0
      ? baseAssetNameContract
      : baseSymbolText || "Base Asset"
  const peggedSymbolText =
    typeof peggedAssetSymbolContract === "string" &&
    peggedAssetSymbolContract.length > 0
      ? peggedAssetSymbolContract
      : "PEG"
  const peggedAssetName =
    typeof peggedAssetNameContract === "string" &&
    peggedAssetNameContract.length > 0
      ? peggedAssetNameContract
      : peggedSymbolText
  const neutronSymbolText =
    typeof neutronSymbol === "string" ? neutronSymbol : "NEUTRON"
  const protonSymbolText =
    typeof protonSymbol === "string" ? protonSymbol : "PROTON"
  const basePricePegged = basePriceWad
  const baseAssetDisplay = `${baseAssetName} (${baseSymbolText})`
  const peggedAssetDisplay = `${peggedAssetName} (${peggedSymbolText})`
  const fissionFeeText =
    typeof fissionFee === "bigint" ? formatPercentFromWad(fissionFee) : "—"
  const fusionFeeText =
    typeof fusionFee === "bigint" ? formatPercentFromWad(fusionFee) : "—"
  const basePricePeggedText =
    basePricePegged !== undefined
      ? `${formatWad(basePricePegged)} ${peggedSymbolText}/${baseSymbolText}`
      : "—"
  const reserveRatioText = (() => {
    if (reserveRatio === undefined) return "—"
    if (reserveRatio === maxUint256) {
      return neutronTotalSupply === 0n ? "∞ (bootstrap)" : "∞"
    }
    return formatPercentFromWad(reserveRatio)
  })()
  const criticalRatioText = criticalReserveRatio
    ? formatPercentFromWad(criticalReserveRatio)
    : "—"

  return {
    baseAmountRaw,
    fusionGrossBaseRaw,
    reserveWad,
    neutronSupplyWad,
    protonSupplyWad,
    basePriceWad,
    baseSymbolText,
    activeBaseSymbol,
    baseAssetName,
    peggedSymbolText,
    neutronSymbolText,
    protonSymbolText,
    neutronPriceInBase,
    protonPriceInBase,
    neutronPricePegged,
    protonPricePegged,
    basePricePegged,
    baseAssetDisplay,
    peggedAssetDisplay,
    fissionFeeText,
    fusionFeeText,
    basePricePeggedText,
    reserveRatioText,
    criticalRatioText,
  }
}

export type ReactorPricing = ReturnType<typeof useReactorPricing>
