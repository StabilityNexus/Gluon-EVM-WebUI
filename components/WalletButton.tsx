"use client"

import { useEffect, useState } from "react"
import {
  useWalletLink,
  WalletLinkButton,
  WalletLinkModal,
} from "@stability-nexus/walletlink"
import { useSwitchChain } from "wagmi"
import { ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type WalletButtonMode = "full" | "compact" | "network" | "action"

export function WalletButton({
  mode = "full",
  className,
}: {
  mode?: WalletButtonMode
  className?: string
}) {
  const { isConnected, isReconnecting, chain } = useWalletLink()
  const { chains, switchChain, isPending, error, reset } = useSwitchChain()
  const [mounted, setMounted] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const [networkOpen, setNetworkOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setConnectOpen(false)
    setNetworkOpen(false)
  }, [isConnected])

  const ready = mounted && !isReconnecting

  const openNetworks = () => {
    reset()
    setNetworkOpen(true)
  }

  const networkButton = (
    <Button
      type="button"
      size={mode === "action" ? "lg" : "sm"}
      variant={chain ? "outline" : "destructive"}
      onClick={openNetworks}
      disabled={!ready}
      aria-label={chain ? `Network: ${chain.name}. Switch network` : "Wrong network. Switch network"}
      className={cn(
        "gap-2",
        (mode === "network" || mode === "action") && "w-full justify-between",
      )}
    >
      {chain?.name ?? "Wrong network"}
      <ArrowLeftRight aria-hidden="true" className="size-3.5" />
    </Button>
  )

  if (mode === "network" && !isConnected) return null

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {mode === "network" ? (
        networkButton
      ) : !isConnected ? (
        <Button
          type="button"
          size={mode === "action" ? "lg" : "sm"}
          disabled={!ready}
          onClick={() => setConnectOpen(true)}
          className={mode === "action" ? "w-full h-12 text-[15px]" : undefined}
        >
          {!ready ? "Loading wallet" : mode === "compact" ? "Connect" : "Connect Wallet"}
        </Button>
      ) : mode === "action" ? (
        !chain && networkButton
      ) : (
        <>
          {(mode === "full" || !chain) && networkButton}
          <WalletLinkButton />
        </>
      )}

      <WalletLinkModal open={connectOpen} onOpenChange={setConnectOpen} />

      <Dialog open={networkOpen && isConnected} onOpenChange={setNetworkOpen}>
        <DialogContent>
          <DialogTitle>Switch network</DialogTitle>
          <DialogDescription>
            Choose a supported network. Your wallet may ask you to confirm.
          </DialogDescription>
          {chains.map((network) => (
            <Button
              key={network.id}
              type="button"
              variant="outline"
              disabled={isPending}
              aria-pressed={chain?.id === network.id}
              onClick={() =>
                switchChain(
                  { chainId: network.id },
                  { onSuccess: () => setNetworkOpen(false) },
                )
              }
            >
              {network.name}
            </Button>
          ))}
          {isPending && <p role="status">Confirm the network change in your wallet.</p>}
          {error && (
            <p role="alert">Could not switch network. Try again in your wallet.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
