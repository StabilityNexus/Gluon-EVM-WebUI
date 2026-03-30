"use client";

import { useChainChangeWatcher } from "@/hooks/useChainChangeWatcher";

export default function ChainWatcherClient() {
  useChainChangeWatcher();
  return null;
}
