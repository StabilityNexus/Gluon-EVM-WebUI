import { scrollSepolia } from "wagmi/chains";
import { citreaTestnet } from "@/components/CitreaTestnet";
import { rootstockTestnet } from "@/components/RootstockTestnet";

export const SUPPORTED_CHAINS = [
  scrollSepolia,
  citreaTestnet,
  rootstockTestnet,
] as const;

export const SUPPORTED_CHAIN_IDS = [534351, 5115, 31] as const;

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];
export type NetworkStatus = "disconnected" | "correct" | "wrong" | "unknown";

const CHAIN_NAME_MAP: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  31: "Rootstock Testnet",
  56: "BNB Smart Chain",
  137: "Polygon",
  42161: "Arbitrum One",
  8453: "Base",
  84532: "Base Sepolia",
  11155111: "Sepolia",
  534351: "Scroll Sepolia",
  5115: "Citrea Testnet",
};

export function isSupportedChain(
  chainId: number | null | undefined,
): chainId is SupportedChainId {
  return (
    typeof chainId === "number" &&
    SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId)
  );
}

export function getChainName(chainId: number | null | undefined): string {
  if (typeof chainId !== "number" || chainId <= 0) return "Unknown";
  return CHAIN_NAME_MAP[chainId] ?? `Unknown (${chainId})`;
}

export function getNetworkStatus(params: {
  isConnected: boolean;
  chainId: number | null | undefined;
}): NetworkStatus {
  const { isConnected, chainId } = params;
  if (!isConnected) return "disconnected";
  if (isSupportedChain(chainId)) return "correct";
  if (typeof chainId === "number" && chainId > 0) {
    return chainId in CHAIN_NAME_MAP ? "wrong" : "unknown";
  }
  return "unknown";
}

export function getPreferredSwitchChainId(
  chainId: number | null | undefined,
): SupportedChainId {
  if (isSupportedChain(chainId)) return chainId;
  return SUPPORTED_CHAIN_IDS[0];
}
