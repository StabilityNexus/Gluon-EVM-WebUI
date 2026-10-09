import { describe, expect, it } from "vitest"
import type { Address } from "viem"

import {
  ERC20ABI,
  StableCoinReactorABI,
  WrappedNativeABI,
} from "@/utils/abi/StableCoin"
import {
  addressesEqual,
  grossFusionAmountForNet,
  resolveNativeAssetConfig,
} from "@/utils/nativeAsset"
import {
  GLUON_NETWORKS,
  getGluonNetwork,
  type NativeAssetConfig,
} from "@/utils/networks"

const WAD = 10n ** 18n

describe("native asset integration", () => {
  it("finds Gluon networks by chain id", () => {
    expect(getGluonNetwork(11155111)?.displayName).toBe(
      "Ethereum Sepolia",
    )
    expect(getGluonNetwork(999999)).toBeUndefined()
  })

  it("does not enable native mode without a configured wrapped-native asset", () => {
    expect(
      GLUON_NETWORKS.every(
        (network) => network.nativeAsset === undefined,
      ),
    ).toBe(true)
  })

  it("requires the Reactor base token and decimals to match the native config", () => {
    const wrapped =
      "0x4200000000000000000000000000000000000006" as Address

    const config: NativeAssetConfig = {
      nativeSymbol: "ETH",
      nativeDecimals: 18,
      wrappedNativeAddress: wrapped,
    }

    expect(
      resolveNativeAssetConfig(config, wrapped, 18),
    ).toEqual(config)

    expect(
      resolveNativeAssetConfig(
        config,
        "0x2222222222222222222222222222222222222222",
        18,
      ),
    ).toBeUndefined()

    expect(
      resolveNativeAssetConfig(config, wrapped, 6),
    ).toBeUndefined()

    expect(
      resolveNativeAssetConfig(config, wrapped, undefined),
    ).toBeUndefined()
  })

  it("compares addresses case-insensitively", () => {
    expect(
      addressesEqual(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD",
      ),
    ).toBe(true)
  })

  it("calculates the exact minimum gross native fusion amount", () => {
    const net = 1n * WAD
    const onePercentFee = 10n ** 16n

    const gross = grossFusionAmountForNet(net, onePercentFee)

    expect(gross).toBe(1010101010101010101n)

    if (gross === null) {
      throw new Error("gross amount should exist")
    }

    const fee = (gross * onePercentFee) / WAD
    const actualNet = gross - fee

    expect(actualNet).toBe(net)
  })

  it("returns the same native fusion amount when the fee is zero", () => {
    expect(
      grossFusionAmountForNet(123456789n, 0n),
    ).toBe(123456789n)
  })

  it("rejects invalid gross-fusion inputs", () => {
    expect(grossFusionAmountForNet(0n, 0n)).toBeNull()
    expect(grossFusionAmountForNet(1n, WAD)).toBeNull()
  })

  it("keeps the frontend independent of the helper-only fusion quote", () => {
    const functionNames = StableCoinReactorABI
      .filter(
        (entry) =>
          entry.type === "function" &&
          "name" in entry,
      )
      .map((entry) => String(entry.name))

    expect(functionNames).not.toContain("fusionBurnAmounts")
  })

  it("exposes WETH-style deposit and withdraw operations", () => {
    const deposit = WrappedNativeABI.find(
      (entry) =>
        entry.type === "function" &&
        entry.name === "deposit",
    )

    const withdraw = WrappedNativeABI.find(
      (entry) =>
        entry.type === "function" &&
        entry.name === "withdraw",
    )

    expect(deposit?.stateMutability).toBe("payable")
    expect(withdraw?.stateMutability).toBe("nonpayable")
  })

  it("keeps the standard ERC20 approve ABI available", () => {
    expect(
      ERC20ABI.some(
        (entry) =>
          entry.type === "function" &&
          "name" in entry &&
          entry.name === "approve",
      ),
    ).toBe(true)
  })
})
