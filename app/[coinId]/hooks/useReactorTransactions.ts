import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  usePublicClient,
  useSendTransaction,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi"
import { parseUnits, isAddress } from "viem"
import {
  StableCoinReactorABI,
  WrappedNativeABI,
  ERC20ABI,
} from "@/utils/abi/StableCoin"
import { addressesEqual } from "@/utils/nativeAsset"
import { toast } from "sonner"
import {
  safeParseUnits,
  WAD,
  NATIVE_FLOW_CONTEXT_CHANGED,
  mulDiv,
} from "../interactionUtils"
import type { InteractionContext } from "./interactionTypes"
import type { InteractionForm } from "./useInteractionForm"
import type { ReactorContracts } from "./useReactorContracts"
import type { ReactorPricing } from "./useReactorPricing"

type ReactorTransactionsInput = Pick<
  InteractionContext & InteractionForm & ReactorContracts & ReactorPricing,
  | "address"
  | "chainId"
  | "amount"
  | "setAmount"
  | "useNativeBase"
  | "setUseNativeBase"
  | "recipient"
  | "route"
  | "baseToken"
  | "refetchBaseToken"
  | "baseDecimalsNumber"
  | "nativeAsset"
  | "refetchNativeBalance"
  | "refetchNeutronToken"
  | "refetchProtonToken"
  | "refetchFissionFee"
  | "fusionFee"
  | "refetchFusionFee"
  | "refetchReserve"
  | "refetchNeutronTotalSupply"
  | "refetchProtonTotalSupply"
  | "refetchBaseBalance"
  | "refetchNeutronBalance"
  | "refetchProtonBalance"
  | "baseAllowance"
  | "refetchBaseAllowance"
  | "neutronDecimalsNumber"
  | "protonDecimalsNumber"
  | "fusionGrossBaseRaw"
  | "baseSymbolText"
  | "reactorAddress"
>

export function useReactorTransactions({
  address,
  chainId,
  amount,
  setAmount,
  useNativeBase,
  setUseNativeBase,
  recipient,
  route,
  baseToken,
  refetchBaseToken,
  baseDecimalsNumber,
  nativeAsset,
  refetchNativeBalance,
  refetchNeutronToken,
  refetchProtonToken,
  refetchFissionFee,
  fusionFee,
  refetchFusionFee,
  refetchReserve,
  refetchNeutronTotalSupply,
  refetchProtonTotalSupply,
  refetchBaseBalance,
  refetchNeutronBalance,
  refetchProtonBalance,
  baseAllowance,
  refetchBaseAllowance,
  neutronDecimalsNumber,
  protonDecimalsNumber,
  fusionGrossBaseRaw,
  baseSymbolText,
  reactorAddress,
}: ReactorTransactionsInput) {
  const latestAddressRef = useRef(address)
  const latestChainIdRef = useRef(chainId)

  useLayoutEffect(() => {
    latestAddressRef.current = address
    latestChainIdRef.current = chainId
  }, [address, chainId])

  const {
    data: approveHash,
    writeContract: writeApprove,
    isPending: isApproving,
  } = useWriteContract()
  const {
    data: fissionHash,
    writeContract: writeFission,
    isPending: isFissioning,
  } = useWriteContract()
  const {
    data: fusionHash,
    writeContract: writeFusion,
    isPending: isFusing,
  } = useWriteContract()
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

  const { isLoading: isApprovingTx, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    })
  const { isLoading: isFissionTx, isSuccess: isFissionSuccess } =
    useWaitForTransactionReceipt({
      hash: fissionHash,
    })
  const { isLoading: isFusionTx, isSuccess: isFusionSuccess } =
    useWaitForTransactionReceipt({
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
    setAmount,
  ])

  useEffect(() => {
    if (isFissionSuccess) toast.success("Base converted into neutron + proton")
  }, [isFissionSuccess])

  useEffect(() => {
    if (isFusionSuccess) toast.success("Neutron + proton redeemed for base")
  }, [isFusionSuccess])

  useEffect(() => {
    if (isProtonToNeutronSuccess)
      toast.success("Proton successfully transmuted to neutron")
  }, [isProtonToNeutronSuccess])

  useEffect(() => {
    if (isNeutronToProtonSuccess)
      toast.success("Neutron successfully transmuted to proton")
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

  const assertNativeFlowContext = (
    expectedAddress: `0x${string}`,
    expectedChainId: number,
  ) => {
    if (
      !addressesEqual(latestAddressRef.current, expectedAddress) ||
      latestChainIdRef.current !== expectedChainId
    ) {
      throw new Error(NATIVE_FLOW_CONTEXT_CHANGED)
    }
  }

  const isNativeFlowContextError = (error: unknown) =>
    error instanceof Error && error.message === NATIVE_FLOW_CONTEXT_CHANGED

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

    if (!isAddress(recipient)) {
      toast.error("Enter a valid recipient address")
      return
    }

    try {
      switch (route) {
        case "FISSION": {
          if (useNativeBase) {
            if (!nativeAsset || !address || !publicClient) {
              toast.error(
                "Native asset support is not available for this reactor",
              )
              return
            }

            const flowAddress = address
            const flowChainId = chainId

            const parsedNative = safeParseUnits(
              amount,
              nativeAsset.nativeDecimals,
            )
            if (parsedNative === null || parsedNative <= 0n) {
              toast.error("Invalid native amount")
              return
            }

            setIsNativeFlowProcessing(true)
            let wrapSubmitted = false
            let wrapCompleted = false
            let fissionSubmitted = false

            try {
              assertNativeFlowContext(flowAddress, flowChainId)

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

              assertNativeFlowContext(flowAddress, flowChainId)

              // 2. Read the latest allowance and approve only when needed.
              const currentAllowance = await publicClient.readContract({
                address: nativeAsset.wrappedNativeAddress,
                abi: ERC20ABI,
                functionName: "allowance",
                args: [flowAddress, reactorAddress as `0x${string}`],
              })

              if (parsedNative > currentAllowance) {
                assertNativeFlowContext(flowAddress, flowChainId)

                const approveWrappedHash = await writeNativeContract({
                  address: nativeAsset.wrappedNativeAddress,
                  abi: ERC20ABI,
                  functionName: "approve",
                  args: [reactorAddress as `0x${string}`, parsedNative],
                })

                await waitForNativeReceipt(approveWrappedHash)
              }

              assertNativeFlowContext(flowAddress, flowChainId)

              // 3. Use the existing Reactor fission path.
              const nativeFissionHash = await writeNativeContract({
                address: reactorAddress as `0x${string}`,
                abi: StableCoinReactorABI,
                functionName: "fission",
                args: [parsedNative, recipient as `0x${string}`],
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

              if (isNativeFlowContextError(error)) {
                if (wrapSubmitted) {
                  setAmount("")
                }

                toast.error(
                  "Wallet account or network changed during native fission. Check the original wallet before retrying.",
                )
              } else if (fissionSubmitted) {
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

            const flowAddress = address
            const flowChainId = chainId

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
              assertNativeFlowContext(flowAddress, flowChainId)

              // 1. Redeem through the existing Reactor. The wrapped-native
              // output must first return to the connected wallet so that the
              // wallet can unwrap it without a helper contract.
              const nativeFusionHash = await writeNativeContract({
                address: reactorAddress as `0x${string}`,
                abi: StableCoinReactorABI,
                functionName: "fusion",
                args: [fusionGrossBaseRaw, flowAddress],
              })
              fusionSubmitted = true
              await waitForNativeReceipt(nativeFusionHash)
              fusionCompleted = true

              assertNativeFlowContext(flowAddress, flowChainId)

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

              assertNativeFlowContext(flowAddress, flowChainId)

              // 3. If a different recipient was requested, forward the native
              // asset from the user's wallet after the unwrap.
              if (!addressesEqual(recipient, flowAddress)) {
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

              if (isNativeFlowContextError(error)) {
                if (fusionSubmitted) {
                  setAmount("")
                }

                toast.error(
                  "Wallet account or network changed during native fusion. Check the original wallet before retrying.",
                )
              } else if (fusionSubmitted) {
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
                  !addressesEqual(recipient, flowAddress) &&
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
            args: [parsedFusionAmount, recipient as `0x${string}`],
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

  return {
    isApproving,
    isApprovingTx,
    needsApproval,
    approvalSymbol,
    isProcessing,
    handleApprove,
    handleSwap,
  }
}

export type ReactorTransactions = ReturnType<typeof useReactorTransactions>
