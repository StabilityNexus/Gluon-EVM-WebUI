"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import {
  getWalletLogs,
  subscribeWalletLogs,
  type WalletLogEntry,
} from "@/lib/walletLogger";

export default function WalletDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<WalletLogEntry[]>([]);
  const {
    chainId,
    networkStatus,
    isConnected,
    isConnecting,
    isSwitchingChain,
    connectionError,
    switchError,
  } = useWalletConnection();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    setEntries(getWalletLogs());
    return subscribeWalletLogs(setEntries);
  }, []);

  const lastError = useMemo(
    () => switchError?.message ?? connectionError?.message ?? "None",
    [connectionError?.message, switchError?.message],
  );

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[1300] w-[320px] max-w-[calc(100vw-2rem)]">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mb-2 w-full bg-background/90 backdrop-blur-sm"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "Hide Wallet Debug" : "Show Wallet Debug"}
      </Button>
      {isOpen ? (
        <div className="rounded-md border bg-background/95 p-3 text-xs shadow-lg backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span className="text-muted-foreground">Connected</span>
            <span>{isConnected ? "Yes" : "No"}</span>
            <span className="text-muted-foreground">Chain ID</span>
            <span>{chainId ?? "N/A"}</span>
            <span className="text-muted-foreground">Status</span>
            <span>{networkStatus}</span>
            <span className="text-muted-foreground">Connecting</span>
            <span>{isConnecting ? "Yes" : "No"}</span>
            <span className="text-muted-foreground">Switching</span>
            <span>{isSwitchingChain ? "Yes" : "No"}</span>
            <span className="text-muted-foreground">Last Error</span>
            <span className="truncate">{lastError}</span>
          </div>
          <div className="mt-3 max-h-56 overflow-auto rounded border bg-muted/30 p-2 font-mono">
            {entries.length === 0 ? (
              <p className="text-muted-foreground">No wallet events yet.</p>
            ) : (
              entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="mb-1 border-b border-border/50 pb-1 last:mb-0 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{entry.event}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-[10px] text-muted-foreground">
                    {JSON.stringify(entry.payload)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
