"use client";

import { useEffect, useRef } from "react";
import { useAccount, useChainId } from "wagmi";
import { getNetworkStatus } from "@/lib/chains";
import { logWalletEvent } from "@/lib/walletLogger";

type ChainChangePayload = {
  previousChainId?: number;
  currentChainId: number;
  networkStatus: "correct" | "wrong" | "unknown" | "disconnected";
};

type UseChainChangeWatcherParams = {
  enabled?: boolean;
  onChainChange?: (payload: ChainChangePayload) => void;
};

export function useChainChangeWatcher(params?: UseChainChangeWatcherParams) {
  const enabled = params?.enabled ?? true;
  const onChainChange = params?.onChainChange;
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const previousChainIdRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    if (!isConnected) {
      previousChainIdRef.current = undefined;
      return;
    }

    if (previousChainIdRef.current === undefined) {
      previousChainIdRef.current = chainId;
      return;
    }

    if (previousChainIdRef.current !== chainId) {
      const networkStatus = getNetworkStatus({ isConnected, chainId });

      logWalletEvent("chain_changed", {
        previousChainId: previousChainIdRef.current,
        currentChainId: chainId,
        networkStatus,
      });

      onChainChange?.({
        previousChainId: previousChainIdRef.current,
        currentChainId: chainId,
        networkStatus,
      });

      previousChainIdRef.current = chainId;
    }
  }, [chainId, enabled, isConnected, onChainChange]);
}
