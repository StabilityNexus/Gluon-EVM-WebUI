"use client";

import { SUPPORTED_CHAINS, type SupportedChainId } from "@/lib/chains";
import { Button } from "@/components/ui/button";

type ChainSwitcherProps = {
  value: SupportedChainId;
  onValueChange: (chainId: SupportedChainId) => void;
  onSwitch: () => void;
  isSwitching?: boolean;
  disabled?: boolean;
};

export function ChainSwitcher({
  value,
  onValueChange,
  onSwitch,
  isSwitching = false,
  disabled = false,
}: ChainSwitcherProps) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <select
        aria-label="Choose supported network"
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        value={String(value)}
        onChange={(event) =>
          onValueChange(Number(event.target.value) as SupportedChainId)
        }
        disabled={disabled || isSwitching}
      >
        {SUPPORTED_CHAINS.map((chain) => (
          <option key={chain.id} value={chain.id}>
            {chain.name}
          </option>
        ))}
      </select>

      <Button
        type="button"
        size="sm"
        aria-label="Switch network"
        className="sm:w-auto"
        onClick={onSwitch}
        disabled={disabled || isSwitching}
      >
        {isSwitching ? "Switching..." : "Switch Network"}
      </Button>
    </div>
  );
}
