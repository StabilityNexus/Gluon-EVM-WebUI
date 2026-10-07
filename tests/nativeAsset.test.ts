import { describe, expect, it } from "vitest"
import type { Address } from "viem"

import {
  ERC20ABI,
  NativeAssetHelperABI,
  StableCoinReactorABI,
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

  it("does not currently enable native mode without a verified deployment", () => {
    expect(
      GLUON_NETWORKS.every(
        (network) => network.nativeAsset === undefined,
      ),
    ).toBe(true)
  })

  it("requires both reactor base and helper wrapper to match configuration", () => {
    const wrapped =
      "0x4200000000000000000000000000000000000006" as Address
    const helper =
      "0x1111111111111111111111111111111111111111" as Address

    const config: NativeAssetConfig = {
      nativeSymbol: "ETH",
      nativeDecimals: 18,
      wrappedNativeAddress: wrapped,
      helperAddress: helper,
    }

    expect(
      resolveNativeAssetConfig(config, wrapped, wrapped),
    ).toEqual(config)

    expect(
      resolveNativeAssetConfig(
        config,
        "0x2222222222222222222222222222222222222222",
        wrapped,
      ),
    ).toBeUndefined()

    expect(
      resolveNativeAssetConfig(
        config,
        wrapped,
        "0x3333333333333333333333333333333333333333",
      ),
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

  it("calculates the exact minimum gross fusion amount", () => {
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

  it("returns the same amount when the fusion fee is zero", () => {
    expect(
      grossFusionAmountForNet(123456789n, 0n),
    ).toBe(123456789n)
  })

  it("rejects invalid gross-fusion inputs", () => {
    expect(grossFusionAmountForNet(0n, 0n)).toBeNull()
    expect(grossFusionAmountForNet(1n, WAD)).toBeNull()
  })

  it("exposes fusionBurnAmounts on the reactor ABI", () => {
    const quote = StableCoinReactorABI.find(
      (entry) =>
        entry.type === "function" &&
        "name" in entry &&
        entry.name === "fusionBurnAmounts",
    )

    expect(quote).toBeDefined()

    if (!quote || quote.type !== "function") {
      throw new Error("fusionBurnAmounts ABI missing")
    }

    expect(quote.stateMutability).toBe("view")
    expect(quote.inputs).toHaveLength(1)
    expect(quote.outputs).toHaveLength(2)
  })

  it("exposes the required NativeAssetHelper ABI", () => {
    const fissionNative = NativeAssetHelperABI.find(
      (entry) =>
        entry.type === "function" &&
        "name" in entry &&
        entry.name === "fissionNative",
    )

    const fusionNative = NativeAssetHelperABI.find(
      (entry) =>
        entry.type === "function" &&
        "name" in entry &&
        entry.name === "fusionNative",
    )

    const wrappedNative = NativeAssetHelperABI.find(
      (entry) =>
        entry.type === "function" &&
        "name" in entry &&
        entry.name === "WRAPPED_NATIVE",
    )

    expect(fissionNative?.stateMutability).toBe("payable")
    expect(fusionNative?.stateMutability).toBe("nonpayable")
    expect(wrappedNative?.stateMutability).toBe("view")
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
