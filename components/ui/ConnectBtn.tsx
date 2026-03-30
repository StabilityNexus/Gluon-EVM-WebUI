"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle, ChevronDown, LogOut, Wallet } from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { truncateAddress, getWalletMeta } from "@/lib/wallets";
import { getPreferredSwitchChainId, type SupportedChainId } from "@/lib/chains";
import { logWalletEvent } from "@/lib/walletLogger";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChainSwitcher } from "@/components/ui/ChainSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ConnectBtnProps = {
  className?: string;
  compact?: boolean;
};

const statusMeta = {
  correct: {
    label: "Connected",
    className: "bg-emerald-500/20 text-emerald-700 border-emerald-500/40",
  },
  wrong: {
    label: "Wrong Network",
    className: "bg-amber-500/20 text-amber-700 border-amber-500/40",
  },
  unknown: {
    label: "Unknown Network",
    className: "bg-orange-500/20 text-orange-700 border-orange-500/40",
  },
};

export function ConnectBtn({ className, compact = false }: ConnectBtnProps) {
  const {
    address,
    chainId,
    connector,
    connectors,
    isConnected,
    isConnecting,
    isSwitchingChain,
    networkStatus,
    currentChainLabel,
    connectionError,
    switchError,
    connectWallet,
    disconnectWallet,
    switchToChain,
  } = useWalletConnection();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<SupportedChainId>(
    getPreferredSwitchChainId(chainId),
  );

  useEffect(() => {
    setSelectedChainId(getPreferredSwitchChainId(chainId));
  }, [chainId]);

  const accountLabel = useMemo(() => truncateAddress(address), [address]);
  const connectorMeta = connector ? getWalletMeta(connector) : null;
  const status =
    networkStatus === "disconnected"
      ? statusMeta.correct
      : statusMeta[networkStatus];
  const shouldShowNetworkRecovery =
    isConnected && (networkStatus === "wrong" || networkStatus === "unknown");

  if (!isConnected) {
    return (
      <>
        <Button
          type="button"
          size={compact ? "sm" : "default"}
          className={cn("gap-2", className)}
          onClick={() => {
            setIsModalOpen(true);
            logWalletEvent("connect_modal_open");
          }}
          disabled={isConnecting}
          aria-label="Connect wallet"
        >
          <Wallet className="h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>

        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            logWalletEvent(open ? "connect_modal_open" : "connect_modal_close");
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Choose a wallet to connect. Supported chains: Scroll Sepolia,
                Citrea Testnet, Rootstock Testnet.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              {connectors.map((item) => {
                const meta = getWalletMeta(item);

                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant="outline"
                    className="h-11 justify-between px-3"
                    disabled={isConnecting}
                    onClick={async () => {
                      await connectWallet(item.id);
                      setIsModalOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Image src={meta.icon} alt="" width={18} height={18} />
                      <span>{meta.label}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isConnecting ? "Pending..." : "Available"}
                    </span>
                  </Button>
                );
              })}
              {connectors.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                  No injected wallet detected. Install a browser wallet and
                  refresh.
                </p>
              ) : null}
            </div>

            {connectionError ? (
              <p className="text-sm text-destructive" role="alert">
                {connectionError.message}
              </p>
            ) : null}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (shouldShowNetworkRecovery) {
    const status = statusMeta[networkStatus];

    return (
      <div
        className={cn(
          "flex min-w-[220px] flex-col gap-2 rounded-md border border-border bg-background/80 p-2",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <Badge className={cn("border", status.className)}>
            {status.label}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={disconnectWallet}
            aria-label="Disconnect wallet"
          >
            <LogOut className="h-3.5 w-3.5" />
            {!compact ? "Disconnect" : null}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {currentChainLabel} {chainId ? `(${chainId})` : ""}
        </div>

        <ChainSwitcher
          value={selectedChainId}
          onValueChange={(targetChainId) => {
            setSelectedChainId(targetChainId);
            logWalletEvent("chain_target_select", { targetChainId });
          }}
          onSwitch={() => void switchToChain(selectedChainId)}
          isSwitching={isSwitchingChain}
        />

        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-foreground/80">{accountLabel}</span>
          <span className="text-muted-foreground">
            {connectorMeta?.label ?? "Wallet"}
          </span>
        </div>

        {switchError ? (
          <p
            className="flex items-center gap-1 text-xs text-destructive"
            role="alert"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {switchError.message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <DropdownMenu
      open={isDropdownOpen}
      onOpenChange={(open) => {
        setIsDropdownOpen(open);
        logWalletEvent(open ? "dropdown_open" : "dropdown_close");
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size={compact ? "sm" : "default"}
          variant="outline"
          className={cn("gap-2", className)}
          aria-label="Wallet details"
        >
          <Wallet className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{accountLabel}</span>
          {!compact ? (
            <span className="text-xs text-muted-foreground">
              ({currentChainLabel})
            </span>
          ) : null}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[1200] min-w-[260px]">
        <DropdownMenuItem className="flex items-center justify-between text-xs">
          <span>Network</span>
          <span className="font-medium">{currentChainLabel}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center justify-between text-xs">
          <span>Account</span>
          <span className="font-mono">{accountLabel}</span>
        </DropdownMenuItem>
        <div className="px-2 py-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge className={cn("border text-[10px]", status.className)}>
              {status.label}
            </Badge>
          </div>
          <ChainSwitcher
            value={selectedChainId}
            onValueChange={(targetChainId) => {
              setSelectedChainId(targetChainId);
              logWalletEvent("chain_target_select", { targetChainId });
            }}
            onSwitch={() => void switchToChain(selectedChainId)}
            isSwitching={isSwitchingChain}
          />
        </div>
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={disconnectWallet}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
