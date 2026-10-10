import { useMemo } from "react"
import { grossFusionAmountForNet } from "@/utils/nativeAsset"
import {
  formatPercentFromWad,
  safeParseUnits,
  WAD,
  PEGGED_ASSET_WAD,
  mulDiv,
  scaleToWad,
  computeQWad,
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
  const basePriceWad = useMemo(() => {
    if (typeof onChainBasePriceWad === "bigint" && onChainBasePriceWad > 0n) {
      return onChainBasePriceWad
    }
    return undefined
  }, [onChainBasePriceWad])
  const qWad = useMemo(
    () =>
      computeQWad(
        reserveWad,
        neutronSupplyWad,
        basePriceWad,
        criticalReserveRatio,
      ),
    [reserveWad, neutronSupplyWad, basePriceWad, criticalReserveRatio],
  )
  const neutronPriceInBaseDerived = useMemo(() => {
    if (!reserveWad || reserveWad === 0n) return 0n
    if (!basePriceWad || basePriceWad === 0n) return undefined
    if (neutronTotalSupply === undefined || neutronDecimalsNumber === undefined)
      return undefined
    if (neutronTotalSupply === 0n) {
      return mulDiv(PEGGED_ASSET_WAD, WAD, basePriceWad)
    }
    if (!neutronSupplyWad || neutronSupplyWad === 0n) return undefined
    const q = qWad
    if (q === undefined) return undefined
    return mulDiv(q, reserveWad, neutronSupplyWad)
  }, [
    reserveWad,
    neutronSupplyWad,
    basePriceWad,
    neutronTotalSupply,
    neutronDecimalsNumber,
    qWad,
  ])

  const protonPriceInBaseDerived = useMemo(() => {
    if (!reserveWad || !basePriceWad) return undefined
    if (protonTotalSupply === undefined || protonDecimalsNumber === undefined)
      return undefined
    if (protonTotalSupply === 0n) return WAD
    if (!protonSupplyWad || protonSupplyWad === 0n) return undefined
    const q = qWad
    if (q === undefined) return undefined
    const oneMinusQ = q >= WAD ? 0n : WAD - q
    return mulDiv(oneMinusQ, reserveWad, protonSupplyWad)
  }, [
    reserveWad,
    protonSupplyWad,
    protonTotalSupply,
    protonDecimalsNumber,
    qWad,
    basePriceWad,
  ])

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
  const neutronPriceInBase = neutronPriceInBaseDerived
  const protonPriceInBase = protonPriceInBaseDerived
  const neutronPricePegged = neutronPricePeggedDerived
  const protonPricePegged = protonPricePeggedDerived
  const reserveRatio = reserveRatioDerived
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
