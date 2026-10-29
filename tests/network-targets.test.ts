import { describe, expect, it } from "vitest"
import {
  GLUON_CHAINS,
  GLUON_NETWORKS,
  MAINNET_CHAIN_ID,
  SEPOLIA_CHAIN_ID,
} from "@/utils/networks"

describe("deployment targets", () => {
  it("limits historical registry discovery to Sepolia without enabling creation there", () => {
    const configured = GLUON_NETWORKS.filter(({ explorerFactoryAddress }) => explorerFactoryAddress)
    expect(configured.map(({ chain }) => chain.id)).toEqual([SEPOLIA_CHAIN_ID])
    expect(configured[0].explorerFactoryAddress).toBe("0x56a8c79dE3d8e21Dc60e2679c4e296Ac8A4b9F50")
    expect(configured[0].factoryAddress).toBeUndefined()
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
    for (const chainId of [MAINNET_CHAIN_ID, 137, 8453]) {
      expect(
        GLUON_NETWORKS.find(({ chain }) => chain.id === chainId)?.factoryAddress,
      ).toBe("0xcA68B9d5C0285CCf9f5Be2D60d525F292E76322a")
    }
    expect(
      GLUON_NETWORKS.filter(
        ({ chain }) => ![MAINNET_CHAIN_ID, 137, 8453].includes(chain.id),
      ).every(({ factoryAddress }) => factoryAddress === undefined),
    ).toBe(true)
  })
  it("does not offer Sepolia oracles on mainnet", () => {
    for (const { chain, oracles } of GLUON_NETWORKS) {
      if (!chain.testnet) expect(oracles).toBeUndefined()
    }
  })
})
