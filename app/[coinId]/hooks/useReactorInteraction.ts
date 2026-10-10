import { useAccount, useChainId } from "wagmi"
import { useInteractionForm } from "./useInteractionForm"
import { useReactorContracts } from "./useReactorContracts"
import { useReactorPricing } from "./useReactorPricing"
import { useReactorTransactions } from "./useReactorTransactions"
import { useInteractionQuote } from "./useInteractionQuote"
import { useReactorParameters } from "./useReactorParameters"

export function useReactorInteraction(reactorAddress: string) {
  const { address } = useAccount()
  const chainId = useChainId()
  const context = { reactorAddress, address, chainId }
  const form = useInteractionForm(context)
  const contracts = useReactorContracts({ ...context, ...form })
  const pricing = useReactorPricing({ ...form, ...contracts })
  const transactions = useReactorTransactions({
    ...context,
    ...form,
    ...contracts,
    ...pricing,
  })
  const quote = useInteractionQuote({ ...form, ...contracts, ...pricing })
  const parameters = useReactorParameters({
    ...context,
    ...contracts,
    ...pricing,
  })
  const interaction = {
    ...context,
    ...form,
    ...contracts,
    ...pricing,
    ...transactions,
    ...quote,
    ...parameters,
  }

  return {
    vaultHeading: interaction.vaultHeading,
    reactorAddress: interaction.reactorAddress,
    swapDescription: interaction.swapDescription,
    nativeAsset: interaction.nativeAsset,
    route: interaction.route,
    useNativeBase: interaction.useNativeBase,
    baseSymbolText: interaction.baseSymbolText,
    setUseNativeBase: interaction.setUseNativeBase,
    fromBalanceDisplay: interaction.fromBalanceDisplay,
    fromToken: interaction.fromToken,
    setFromToken: interaction.setFromToken,
    disabledTokens: interaction.disabledTokens,
    baseAssetName: interaction.baseAssetName,
    neutronSymbolText: interaction.neutronSymbolText,
    protonSymbolText: interaction.protonSymbolText,
    fromInputType: interaction.fromInputType,
    fromInputPlaceholder: interaction.fromInputPlaceholder,
    fromInputValue: interaction.fromInputValue,
    fromInputReadOnly: interaction.fromInputReadOnly,
    setAmount: interaction.setAmount,
    renderMaxButton: interaction.renderMaxButton,
    handleMaxClick: interaction.handleMaxClick,
    toToken: interaction.toToken,
    setToToken: interaction.setToToken,
    breakdownPopover: interaction.breakdownPopover,
    toLabel: interaction.toLabel,
    bundleLabel: interaction.bundleLabel,
    activeBaseSymbol: interaction.activeBaseSymbol,
    toInputType: interaction.toInputType,
    toInputPlaceholder: interaction.toInputPlaceholder,
    toInputValue: interaction.toInputValue,
    toInputReadOnly: interaction.toInputReadOnly,
    recipient: interaction.recipient,
    setRecipient: interaction.setRecipient,
    amount: interaction.amount,
    needsApproval: interaction.needsApproval,
    handleApprove: interaction.handleApprove,
    isProcessing: interaction.isProcessing,
    isApproving: interaction.isApproving,
    isApprovingTx: interaction.isApprovingTx,
    approvalSymbol: interaction.approvalSymbol,
    handleSwap: interaction.handleSwap,
    actionLabel: interaction.actionLabel,
    infoSections: interaction.infoSections,
  }
}

export type InteractionModel = ReturnType<typeof useReactorInteraction>
