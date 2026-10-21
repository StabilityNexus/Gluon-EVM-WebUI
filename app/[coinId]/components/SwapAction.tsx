import { Button } from "@/components/ui/button"
import { Shield, Zap } from "lucide-react"
import { useAccount } from "wagmi"
import { WalletButton } from "@/components/WalletButton"
import type { InteractionModel } from "../hooks/useReactorInteraction"

type SwapActionProps = {
  model: Pick<
    InteractionModel,
    | "route"
    | "recipient"
    | "amount"
    | "needsApproval"
    | "handleApprove"
    | "isProcessing"
    | "isApproving"
    | "isApprovingTx"
    | "approvalSymbol"
    | "handleSwap"
    | "actionLabel"
  >
}

export function SwapAction({ model }: SwapActionProps) {
  const {
    route,
    recipient,
    amount,
    needsApproval,
    handleApprove,
    isProcessing,
    isApproving,
    isApprovingTx,
    approvalSymbol,
    handleSwap,
    actionLabel,
  } = model

  const { isConnected, chain } = useAccount()

  if (!isConnected || !chain) {
    return <WalletButton mode="action" className="w-full" />
  }

  if (!route) {
    return (
      <Button
        disabled
        className="w-full h-12 sm:h-14 text-[15px] bg-secondary text-muted-foreground disabled:opacity-100"
      >
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
}
