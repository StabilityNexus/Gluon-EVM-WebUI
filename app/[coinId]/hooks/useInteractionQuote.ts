import { useMemo } from "react"
import { formatUnits } from "viem"
import {
  type TokenOption,
  trimFormattedAmount,
  formatBalance,
  pow10,
  safeParseUnits,
  WAD,
  mulDiv,
  formatTokenValue,
  formatWad,
} from "../interactionUtils"
import type { InteractionForm } from "./useInteractionForm"
import type { ReactorContracts } from "./useReactorContracts"
import type { ReactorPricing } from "./useReactorPricing"

type InteractionQuoteInput = Pick<
  InteractionForm & ReactorContracts & ReactorPricing,
  | "fromToken"
  | "toToken"
  | "amount"
  | "setAmount"
  | "useNativeBase"
  | "route"
  | "baseToken"
  | "baseDecimalsNumber"
  | "nativeAsset"
  | "nativeBalance"
  | "neutronToken"
  | "protonToken"
  | "fissionFee"
  | "fusionFee"
  | "reserve"
  | "neutronTotalSupply"
  | "protonTotalSupply"
  | "baseBalance"
  | "neutronBalance"
  | "protonBalance"
  | "neutronDecimalsNumber"
  | "protonDecimalsNumber"
  | "baseAmountRaw"
  | "fusionGrossBaseRaw"
  | "reserveWad"
  | "neutronSupplyWad"
  | "protonSupplyWad"
  | "basePriceWad"
  | "baseSymbolText"
  | "activeBaseSymbol"
  | "peggedSymbolText"
  | "neutronSymbolText"
  | "protonSymbolText"
  | "neutronPriceInBase"
  | "protonPriceInBase"
  | "basePricePegged"
>

export function useInteractionQuote({
  fromToken,
  toToken,
  amount,
  setAmount,
  useNativeBase,
  route,
  baseToken,
  baseDecimalsNumber,
  nativeAsset,
  nativeBalance,
  neutronToken,
  protonToken,
  fissionFee,
  fusionFee,
  reserve,
  neutronTotalSupply,
  protonTotalSupply,
  baseBalance,
  neutronBalance,
  protonBalance,
  neutronDecimalsNumber,
  protonDecimalsNumber,
  baseAmountRaw,
  fusionGrossBaseRaw,
  reserveWad,
  neutronSupplyWad,
  protonSupplyWad,
  basePriceWad,
  baseSymbolText,
  activeBaseSymbol,
  peggedSymbolText,
  neutronSymbolText,
  protonSymbolText,
  neutronPriceInBase,
  protonPriceInBase,
  basePricePegged,
}: InteractionQuoteInput) {
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
    } else if (
      fromToken === "NEUTRON" &&
      neutronBalance &&
      neutronDecimalsNumber !== undefined
    ) {
      const formatted = formatUnits(neutronBalance, neutronDecimalsNumber)
      setAmount(trimFormattedAmount(formatted, 6))
    } else if (
      fromToken === "PROTON" &&
      protonBalance &&
      protonDecimalsNumber !== undefined
    ) {
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

      const neutronOut = mulDiv(
        neutronValueWad,
        pow10(neutronDecimalsNumber),
        WAD,
      )
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

    if (
      !reserveWad ||
      reserveWad === 0n ||
      !neutronSupplyWad ||
      !protonSupplyWad
    ) {
      return null
    }

    const neutronOutWad =
      neutronSupplyWad === 0n
        ? 0n
        : mulDiv(netWad, neutronSupplyWad, reserveWad)
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

    const grossBase = useNativeBase ? fusionGrossBaseRaw : baseAmountRaw

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

    const neutronBurnWad = mulDiv(grossBaseWad, neutronSupplyWad, reserveWad)

    const protonBurnWad = mulDiv(grossBaseWad, protonSupplyWad, reserveWad)

    const neutronBurn = mulDiv(
      neutronBurnWad,
      pow10(neutronDecimalsNumber),
      WAD,
    )

    const protonBurn = mulDiv(protonBurnWad, pow10(protonDecimalsNumber), WAD)

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
          value: formatTokenValue(
            displayFusionBreakdown.neutronBurn,
            neutronDecimalsNumber,
            neutronSymbolText,
          ),
        },
        {
          label: protonSymbolText,
          value: formatTokenValue(
            displayFusionBreakdown.protonBurn,
            protonDecimalsNumber,
            protonSymbolText,
          ),
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
            value: formatTokenValue(
              fissionBreakdown.baseIn,
              baseDecimalsNumber,
              baseSymbolText,
            ),
          },
          {
            label: "Fee retained",
            value: formatTokenValue(
              fissionBreakdown.fee,
              baseDecimalsNumber,
              baseSymbolText,
            ),
          },
          {
            label: "Net base",
            value: formatTokenValue(
              fissionBreakdown.netBase,
              baseDecimalsNumber,
              baseSymbolText,
            ),
          },
          {
            label: `Mint ${neutronSymbolText}`,
            value: formatTokenValue(
              fissionBreakdown.neutronOut,
              neutronDecimalsNumber,
              neutronSymbolText,
            ),
          },
          {
            label: `Mint ${protonSymbolText}`,
            value: formatTokenValue(
              fissionBreakdown.protonOut,
              protonDecimalsNumber,
              protonSymbolText,
            ),
          },
          {
            label: "Oracle price",
            value: (() => {
              const oraclePriceWad =
                fissionBreakdown.basePriceWad ?? basePricePegged
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
            value: formatTokenValue(
              displayFusionBreakdown.grossBase,
              baseDecimalsNumber,
              activeBaseSymbol,
            ),
          },
          {
            label: "Fee withheld",
            value: formatTokenValue(
              displayFusionBreakdown.fee,
              baseDecimalsNumber,
              activeBaseSymbol,
            ),
          },
          {
            label: `Burn ${neutronSymbolText}`,
            value: formatTokenValue(
              displayFusionBreakdown.neutronBurn,
              neutronDecimalsNumber,
              neutronSymbolText,
            ),
          },
          {
            label: `Burn ${protonSymbolText}`,
            value: formatTokenValue(
              displayFusionBreakdown.protonBurn,
              protonDecimalsNumber,
              protonSymbolText,
            ),
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
    return formatTokenValue(
      neutronOut,
      neutronDecimalsNumber,
      neutronSymbolText,
      4,
    )
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
    return formatTokenValue(
      protonOut,
      protonDecimalsNumber,
      protonSymbolText,
      4,
    )
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
    ? fusionBundleSummary ||
      `${neutronSymbolText} + ${protonSymbolText} burn calculated automatically`
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
      return (
        protonToNeutronSummary || `Minted ${neutronSymbolText} appears here`
      )
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

  return {
    toLabel,
    disabledTokens,
    fromBalanceDisplay,
    swapDescription,
    actionLabel,
    handleMaxClick,
    renderMaxButton,
    breakdownPopover,
    fromInputReadOnly,
    fromInputType,
    fromInputValue,
    fromInputPlaceholder,
    toInputReadOnly,
    toInputType,
    toInputValue,
    toInputPlaceholder,
  }
}

export type InteractionQuote = ReturnType<typeof useInteractionQuote>
