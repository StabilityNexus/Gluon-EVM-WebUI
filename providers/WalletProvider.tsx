"use client";

import React, { ReactNode } from "react";
import { config } from "@/utils/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import ChainWatcherClient from "@/components/ChainWatcherClient";
import WalletDebugPanel from "@/components/WalletDebugPanel";

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ChainWatcherClient />
        <WalletDebugPanel />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
