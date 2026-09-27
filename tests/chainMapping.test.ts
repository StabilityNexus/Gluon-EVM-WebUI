import { describe, expect, it } from "vitest"
import { getChainNameForTokenList } from "@/utils/chainMapping"

describe("getChainNameForTokenList", () => {
  it("maps supported mainnet and testnet chain IDs", () => {
    expect(getChainNameForTokenList(1)).toBe("ethereum")
    expect(getChainNameForTokenList(11155111)).toBe("ethereum")
    expect(getChainNameForTokenList(137)).toBe("polygon-pos")
    expect(getChainNameForTokenList(56)).toBe("binance-smart-chain")
    expect(getChainNameForTokenList(8453)).toBe("base")
    expect(getChainNameForTokenList(84532)).toBe("base")
  })

  it("uses the documented fallback list for current Gluon testnets", () => {
    expect(getChainNameForTokenList(534351)).toBe("ethereum")
    expect(getChainNameForTokenList(5115)).toBe("ethereum")
    expect(getChainNameForTokenList(31)).toBe("ethereum")
  })

  it("returns null for unsupported chains", () => {
    expect(getChainNameForTokenList(999999)).toBeNull()
  })
})
