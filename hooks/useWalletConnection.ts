"use client";

import { useCallback, useMemo } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import {
  getChainName,
  getNetworkStatus,
  getPreferredSwitchChainId,
  SUPPORTED_CHAINS,
  type SupportedChainId,
} from "@/lib/chains";
import { logWalletEvent } from "@/lib/walletLogger";

export function useWalletConnection() {
  const { address, chainId, isConnected, connector } = useAccount();
  const {
    connectAsync,
    connectors,
    isPending: isConnecting,
    error: connectionError,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const {
    switchChainAsync,
    isPending: isSwitchingChain,
    error: switchError,
  } = useSwitchChain();

  const networkStatus = useMemo(
    () => getNetworkStatus({ isConnected, chainId }),
    [isConnected, chainId],
  );

  const currentChainLabel = useMemo(() => getChainName(chainId), [chainId]);

  const connectWallet = useCallback(
    async (connectorId?: string) => {
      const target = connectorId
        ? connectors.find((item) => item.id === connectorId)
        : connectors[0];
      if (!target) return;

      logWalletEvent("connect_start", { connectorId: target.id });
      try {
        const result = await connectAsync({ connector: target });
        logWalletEvent("connect_success", {
          connectorId: target.id,
          chainId: result.chainId,
        });
      } catch (error) {
        logWalletEvent("connect_error", {
          connectorId: target.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [connectAsync, connectors],
  );

  const disconnectWallet = useCallback(() => {
    disconnect();
    logWalletEvent("disconnect");
  }, [disconnect]);

  const switchToChain = useCallback(
    async (targetChainId: SupportedChainId) => {
      logWalletEvent("switch_start", { targetChainId });
      try {
        await switchChainAsync({ chainId: targetChainId });
        logWalletEvent("switch_success", { targetChainId });
      } catch (error) {
        logWalletEvent("switch_error", {
          targetChainId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [switchChainAsync],
  );

  const switchToSupportedChain = useCallback(async () => {
    const targetChainId = getPreferredSwitchChainId(chainId);
    await switchToChain(targetChainId);
  }, [chainId, switchToChain]);

  return {
    address,
    chainId,
    connector,
    connectors,
    isConnected,
    isConnecting,
    isSwitchingChain,
    networkStatus,
    currentChainLabel,
    supportedChains: SUPPORTED_CHAINS,
    connectionError,
    switchError,
    connectWallet,
    disconnectWallet,
    switchToChain,
    switchToSupportedChain,
  };
}
