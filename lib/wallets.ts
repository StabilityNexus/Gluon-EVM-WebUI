import type { Connector } from "wagmi";

type WalletMeta = {
  icon: string;
  label: string;
};

const WALLET_META: Record<string, WalletMeta> = {
  injected: { icon: "/wallets/injected.svg", label: "Browser Wallet" },
  metaMask: { icon: "/wallets/metamask.svg", label: "MetaMask" },
};

export function getWalletMeta(connector: Pick<Connector, "id" | "name">) {
  return (
    WALLET_META[connector.id] ?? {
      icon: "/wallets/injected.svg",
      label: connector.name,
    }
  );
}

export function truncateAddress(address: string | undefined, size = 4) {
  if (!address) return "No account";
  if (address.length <= size * 2 + 2) return address;
  return `${address.slice(0, size + 2)}...${address.slice(-size)}`;
}
