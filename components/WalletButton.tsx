"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { ArrowLeftRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type WalletButtonMode = "full" | "compact" | "network"

function ChainMark({ iconUrl, iconBackground, name }: { iconUrl?: string; iconBackground?: string; name?: string }) {
  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt=""
        className="size-4 rounded-full"
        style={{ background: iconBackground }}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="grid size-4 place-items-center rounded-full bg-surface-3 text-[9px] font-semibold text-muted-foreground"
    >
      {name?.charAt(0) ?? "?"}
    </span>
  )
}

/**
 * Wallet controls built on RainbowKit's ConnectButton.Custom so they share the
 * site's button system. All connect / account / chain flows are RainbowKit's own modals.
 */
export function WalletButton({ mode = "full", className }: { mode?: WalletButtonMode; className?: string }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== "loading"
        const connected =
          ready &&
          !!account &&
          !!chain &&
          (!authenticationStatus || authenticationStatus === "authenticated")

        const wrapperProps = !ready
          ? { "aria-hidden": true, style: { opacity: 0, pointerEvents: "none" as const, userSelect: "none" as const } }
          : {}

        if (mode === "network") {
          if (!connected || !chain) return null
          return (
            <div {...wrapperProps} className={className}>
              <Button type="button" variant="outline" onClick={openChainModal} className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <ChainMark iconUrl={chain.hasIcon ? chain.iconUrl : undefined} iconBackground={chain.iconBackground} name={chain.name} />
                  {chain.unsupported ? "Wrong network" : chain.name}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  Switch network
                  <ArrowLeftRight className="size-3.5" />
                </span>
              </Button>
            </div>
          )
        }

        return (
          <div {...wrapperProps} className={cn("flex items-center gap-1.5", className)}>
            {!connected || !account || !chain ? (
              <Button type="button" size="sm" onClick={openConnectModal}>
                {mode === "compact" ? "Connect" : "Connect wallet"}
              </Button>
            ) : chain.unsupported ? (
              <Button type="button" size="sm" variant="destructive" onClick={openChainModal}>
                Wrong network
              </Button>
            ) : (
              <>
                {mode === "full" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={openChainModal}
                    aria-label={`Network: ${chain.name ?? "unknown"}. Switch network`}
                    className="bg-transparent px-2.5 hover:bg-foreground/[0.06]"
                  >
                    <ChainMark iconUrl={chain.hasIcon ? chain.iconUrl : undefined} iconBackground={chain.iconBackground} name={chain.name} />
                    <span className="hidden lg:inline">{chain.name}</span>
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openAccountModal}
                  aria-label={`Account ${account.displayName}. Open account details`}
                  className="bg-transparent font-mono text-xs hover:bg-foreground/[0.06]"
                >
                  {account.displayName}
                </Button>
              </>
            )}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
