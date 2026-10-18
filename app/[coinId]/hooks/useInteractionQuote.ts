import { useMemo } from "react"
import { formatUnits, isAddress } from "viem"
import { useSimulateContract } from "wagmi"
import { StableCoinReactorABI } from "@/utils/abi/StableCoin"
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
import type { InteractionContext } from "./interactionTypes"
import type { InteractionForm } from "./useInteractionForm"
import type { ReactorContracts } from "./useReactorContracts"
import type { ReactorPricing } from "./useReactorPricing"

type InteractionQuoteInput = Pick<
  InteractionContext & InteractionForm & ReactorContracts & ReactorPricing,
  | "reactorAddress"
  | "address"
  | "chainId"
  | "recipient"
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
  | "devFee"
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
  | "basePricePegged"
>

export function useInteractionQuote({
  reactorAddress,
  address,
  chainId,
  recipient,
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
  devFee,
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

  const isTransmutationRoute =
    route === "PROTON_TO_NEUTRON" || route === "NEUTRON_TO_PROTON"
  const transmutationFunction =
    route === "PROTON_TO_NEUTRON"
      ? "transmuteProtonToNeutron"
      : "transmuteNeutronToProton"
  const inputDecimals =
    route === "PROTON_TO_NEUTRON"
      ? protonDecimalsNumber
      : neutronDecimalsNumber
  const transmutationAmount =
    isTransmutationRoute && inputDecimals !== undefined
      ? safeParseUnits(amount, inputDecimals)
      : null
  const canSimulateTransmutation = Boolean(
    isTransmutationRoute &&
    address &&
    isAddress(reactorAddress) &&
    isAddress(recipient) &&
    transmutationAmount !== null &&
    transmutationAmount > 0n,
  )
  // Execute the actual accounting in eth_call, including beta fees, decay,
  // rounding and operating-range checks. Never substitute a gross estimate.
  const transmutationSimulation = useSimulateContract({
    address: isAddress(reactorAddress) ? reactorAddress : undefined,
    abi: StableCoinReactorABI,
    functionName: transmutationFunction,
    args:
      transmutationAmount !== null && isAddress(recipient)
        ? [transmutationAmount, 0n, recipient]
        : undefined,
    account: address,
    chainId,
    query: {
      enabled: canSimulateTransmutation,
      refetchInterval: 15_000,
      retry: false,
    },
  })
  const transmutationOutput =
    canSimulateTransmutation &&
    !transmutationSimulation.isFetching &&
    !transmutationSimulation.isError
      ? transmutationSimulation.data?.result[0]
      : undefined

  const isFissionRoute = route === "FISSION"
  const isFusionRoute = route === "FUSION"
  const fissionBreakdown = useMemo(() => {
    if (!isFissionRoute) return null
    if (!baseAmountRaw || baseAmountRaw <= 0n) return null
    if (fissionFee === undefined || devFee === undefined || reserve === undefined) {
      return null
    }

    const fee = mulDiv(baseAmountRaw, fissionFee, WAD)
    const devFeeAmount = mulDiv(baseAmountRaw, devFee, WAD)
    const netBase = baseAmountRaw - fee - devFeeAmount
    if (netBase <= 0n) {
      return {
        baseIn: baseAmountRaw,
        fee,
        devFeeAmount,
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
        devFeeAmount,
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
          devFeeAmount,
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
          devFeeAmount,
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
          devFeeAmount,
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
          devFeeAmount,
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
          devFeeAmount,
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
        devFeeAmount,
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
      devFeeAmount,
      netBase,
      neutronOut,
      protonOut,
    }
  }, [
    isFissionRoute,
    baseAmountRaw,
    fissionFee,
    devFee,
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
    if (fusionFee === undefined || devFee === undefined) return null

    const grossBase = useNativeBase ? fusionGrossBaseRaw : baseAmountRaw

    if (!grossBase || grossBase <= 0n) return null

    const fee = mulDiv(grossBase, fusionFee, WAD)
    const devFeeAmount = mulDiv(grossBase, devFee, WAD)
    const netBase = grossBase - fee - devFeeAmount

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
      devFeeAmount,
      netBase,
      neutronBurn,
      protonBurn,
    }
  }, [
    isFusionRoute,
    baseAmountRaw,
    fusionGrossBaseRaw,
    fusionFee,
    devFee,
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
            label: "Dev fee",
            value: formatTokenValue(fissionBreakdown.devFeeAmount, baseDecimalsNumber, baseSymbolText),
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
            label: "Fee retained",
            value: formatTokenValue(
              displayFusionBreakdown.fee,
              baseDecimalsNumber,
              activeBaseSymbol,
            ),
          },
          {
            label: "Dev fee",
            value: formatTokenValue(displayFusionBreakdown.devFeeAmount, baseDecimalsNumber, activeBaseSymbol),
          },
          {
            label: "Net received",
            value: formatTokenValue(displayFusionBreakdown.netBase, baseDecimalsNumber, activeBaseSymbol),
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

  const transmutationSummary = useMemo(() => {
    if (transmutationOutput === undefined || transmutationOutput <= 0n) return ""
    const outputDecimals =
      route === "PROTON_TO_NEUTRON"
        ? neutronDecimalsNumber
        : protonDecimalsNumber
    if (outputDecimals === undefined) return ""
    const outputSymbol =
      route === "PROTON_TO_NEUTRON"
        ? neutronSymbolText
        : protonSymbolText
    return formatTokenValue(transmutationOutput, outputDecimals, outputSymbol, 4)
  }, [
    transmutationOutput,
    route,
    neutronDecimalsNumber,
    protonDecimalsNumber,
    neutronSymbolText,
    protonSymbolText,
  ])

  const outputDecimals =
    route === "PROTON_TO_NEUTRON"
      ? neutronDecimalsNumber
      : protonDecimalsNumber
  const minimumOutputText =
    transmutationOutput !== undefined && transmutationOutput > 0n && outputDecimals !== undefined
    ? `Minimum received: ${formatUnits(transmutationOutput, outputDecimals)} ${toLabel}. The transaction reverts if output falls below this amount.`
    : ""

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
    if (isTransmutationRoute) return transmutationSummary
    return ""
  }, [
    isFusionRoute,
    amount,
    isFissionRoute,
    fissionMintSummary,
    isTransmutationRoute,
    transmutationSummary,
  ])

  const toInputPlaceholder = useMemo(() => {
    if (isFusionRoute) {
      return `Enter the amount of ${activeBaseSymbol} you want back`
    }
    if (isFissionRoute) {
      return fissionMintSummary || "Minted bundle appears here"
    }
    if (isTransmutationRoute) {
      if (transmutationSummary) return transmutationSummary
      if (!address) return "Connect wallet to estimate output"
      if (transmutationSimulation.isFetching) return "Calculating output…"
      if (transmutationAmount !== null && transmutationAmount > 0n) {
        return "Estimate unavailable"
      }
      return `Minted ${toLabel} appears here`
    }
    return "Calculated on-chain"
  }, [
    isFusionRoute,
    activeBaseSymbol,
    isFissionRoute,
    fissionMintSummary,
    isTransmutationRoute,
    transmutationSummary,
    address,
    transmutationSimulation.isFetching,
    transmutationAmount,
    toLabel,
  ])

  return {
    transmutationOutput,
    minimumOutputText,
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
