import { describe, expect, it } from "vitest"
import {
  GLUON_CHAINS,
  GLUON_NETWORKS,
  MAINNET_CHAIN_ID,
  SEPOLIA_CHAIN_ID,
} from "@/utils/networks"

describe("deployment targets", () => {
  it("preserves historical Sepolia discovery alongside the current creation Factory", () => {
    const configured = GLUON_NETWORKS.filter(({ explorerFactoryAddress }) => explorerFactoryAddress)
    expect(configured.map(({ chain }) => chain.id)).toEqual([SEPOLIA_CHAIN_ID])
    expect(configured[0].explorerFactoryAddress).toBe("0x56a8c79dE3d8e21Dc60e2679c4e296Ac8A4b9F50")
    expect(configured[0].factoryAddress).toBe("0x7e04a17f09EACa400c9CFca690C5a1859FE7DCD5")
  })
  it("lists the requested mainnets in order followed by one testnet", () => {
    expect(GLUON_NETWORKS.map(({ chain }) => chain.id)).toEqual([
      61,
      1,
      137,
      56,
      8453,
      SEPOLIA_CHAIN_ID,
    ])
    expect(GLUON_CHAINS[0].id).toBe(SEPOLIA_CHAIN_ID)
    expect(GLUON_CHAINS.filter(({ testnet }) => testnet)).toHaveLength(1)
    for (const chainId of [61, MAINNET_CHAIN_ID, 137, 56, 8453]) {
      expect(
        GLUON_NETWORKS.find(({ chain }) => chain.id === chainId)?.factoryAddress,
      ).toBe("0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a")
    }
    expect(
      GLUON_NETWORKS.find(
        ({ chain }) => chain.id === SEPOLIA_CHAIN_ID,
      )?.factoryAddress,
    ).toBe("0x7e04a17f09EACa400c9CFca690C5a1859FE7DCD5")
    expect(
      GLUON_NETWORKS.every(
        ({ factoryAddress }) => factoryAddress !== undefined,
      ),
    ).toBe(true)
  })
  it("does not offer Sepolia oracles on mainnet", () => {
    for (const { chain, oracles } of GLUON_NETWORKS) {
      if (!chain.testnet) expect(oracles).toBeUndefined()
    }
  })
})
