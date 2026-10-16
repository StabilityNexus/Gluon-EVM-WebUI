import { describe, expect, it } from "vitest"
import { parseBetaParameters } from "@/utils/betaParameters"

const defaults = {
  betaFeePercent: "0",
  betaVolumeCoefficient: "0",
  volumeRetentionPerSecond: "1",
}

describe("deployment beta parameters", () => {
  it("preserves the previous no-fee, no-decay settings", () => {
    expect(parseBetaParameters(defaults)).toEqual({
      betaPhi0: 0n,
      betaPhi1: 0n,
      decayPerSecondWad: 10n ** 18n,
    })
  })

  it("converts percentages and fractional multipliers without floating point", () => {
    expect(parseBetaParameters({
      betaFeePercent: "1.2345678901234567",
      betaVolumeCoefficient: "0.123456789012345678",
      volumeRetentionPerSecond: "0.999999999999999999",
    })).toEqual({
      betaPhi0: 12345678901234567n,
      betaPhi1: 123456789012345678n,
      decayPerSecondWad: 999999999999999999n,
    })
  })

  it("accepts both contract boundaries", () => {
    expect(parseBetaParameters({
      betaFeePercent: "100",
      betaVolumeCoefficient: "1",
      volumeRetentionPerSecond: "0",
    })).toEqual({ betaPhi0: 10n ** 18n, betaPhi1: 10n ** 18n, decayPerSecondWad: 0n })
  })

  it.each([
    ["betaFeePercent", "100.0000000000000001"],
    ["betaFeePercent", "0.00000000000000001"],
    ["betaVolumeCoefficient", "1.000000000000000001"],
    ["betaVolumeCoefficient", "0.0000000000000000001"],
    ["volumeRetentionPerSecond", "1.000000000000000001"],
    ["volumeRetentionPerSecond", "0.0000000000000000001"],
    ["volumeRetentionPerSecond", "-0.1"],
    ["betaFeePercent", "1e2"],
    ["betaVolumeCoefficient", "NaN"],
    ["betaFeePercent", ""],
  ])("rejects invalid %s value %s instead of rounding it", (field, value) => {
    expect(() => parseBetaParameters({ ...defaults, [field]: value })).toThrow()
  })
})
