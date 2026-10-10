import { useMemo } from "react"
import { formatBalance, type InfoSection, formatWad } from "../interactionUtils"
import type { InteractionContext } from "./interactionTypes"
import type { ReactorContracts } from "./useReactorContracts"
import type { ReactorPricing } from "./useReactorPricing"

type ReactorParametersInput = Pick<
  InteractionContext & ReactorContracts & ReactorPricing,
  | "vaultName"
  | "oracleAddress"
  | "baseToken"
  | "baseDecimalsNumber"
  | "treasury"
  | "reserve"
  | "neutronTotalSupply"
  | "protonTotalSupply"
  | "neutronDecimalsNumber"
  | "protonDecimalsNumber"
  | "baseSymbolText"
  | "peggedSymbolText"
  | "neutronSymbolText"
  | "protonSymbolText"
  | "neutronPriceInBase"
  | "protonPriceInBase"
  | "neutronPricePegged"
  | "protonPricePegged"
  | "baseAssetDisplay"
  | "peggedAssetDisplay"
  | "fissionFeeText"
  | "fusionFeeText"
  | "basePricePeggedText"
  | "reserveRatioText"
  | "criticalRatioText"
  | "reactorAddress"
>

export function useReactorParameters({
  vaultName,
  oracleAddress,
  baseToken,
  baseDecimalsNumber,
  treasury,
  reserve,
  neutronTotalSupply,
  protonTotalSupply,
  neutronDecimalsNumber,
  protonDecimalsNumber,
  baseSymbolText,
  peggedSymbolText,
  neutronSymbolText,
  protonSymbolText,
  neutronPriceInBase,
  protonPriceInBase,
  neutronPricePegged,
  protonPricePegged,
  baseAssetDisplay,
  peggedAssetDisplay,
  fissionFeeText,
  fusionFeeText,
  basePricePeggedText,
  reserveRatioText,
  criticalRatioText,
  reactorAddress,
}: ReactorParametersInput) {
  const vaultHeading =
    typeof vaultName === "string" && vaultName.trim().length > 0
      ? /reactor$/i.test(vaultName.trim())
        ? vaultName.trim()
        : `${vaultName.trim()} Reactor`
      : "StableCoin Reactor"

  const treasuryAddress = typeof treasury === "string" ? treasury : undefined
  const oracleAddressText =
    typeof oracleAddress === "string" ? oracleAddress : undefined
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

  const infoSections = useMemo<InfoSection[]>(() => {
    const sections: InfoSection[] = []

    sections.push({
      title: "Vault Posture",
      description: "Core reserve state and fee policy for this reactor.",
      items: [
        {
          label: "Reserve Balance",
          value: reserveBalanceText,
          emphasize: true,
        },
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
        {
          label: "Vault Address",
          value: reactorAddress ?? "—",
          monospace: true,
        },
        { label: "Treasury", value: treasuryAddress ?? "—", monospace: true },
        { label: "Oracle", value: oracleAddressText ?? "—", monospace: true },
        {
          label: "Base Token",
          value: baseTokenAddress ?? "—",
          monospace: true,
        },
      ],
    })

    sections.push({
      title: `${neutronSymbolText} Metrics`,
      description: "Stable asset supply and price snapshots.",
      items: [
        { label: "Supply", value: neutronSupplyText, emphasize: true },
        {
          label: `${neutronSymbolText}/${baseSymbolText}`,
          value: neutronBasePriceText,
        },
        {
          label: `${neutronSymbolText}/${peggedSymbolText}`,
          value: neutronPegPriceText,
        },
      ],
    })

    sections.push({
      title: `${protonSymbolText} Metrics`,
      description: "Volatile asset issuance and pricing context.",
      items: [
        { label: "Supply", value: protonSupplyText, emphasize: true },
        {
          label: `${protonSymbolText}/${baseSymbolText}`,
          value: protonBasePriceText,
        },
        {
          label: `${protonSymbolText}/${peggedSymbolText}`,
          value: protonPegPriceText,
        },
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

  return {
    vaultHeading,
    bundleLabel,
    infoSections,
  }
}

export type ReactorParameters = ReturnType<typeof useReactorParameters>
