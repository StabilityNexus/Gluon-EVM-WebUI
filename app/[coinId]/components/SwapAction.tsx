import { Button } from "@/components/ui/button"
import { Shield, Zap } from "lucide-react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
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

  return (
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
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
