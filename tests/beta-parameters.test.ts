import { describe, expect, it } from "vitest"
import { parseBetaParameters } from "@/utils/betaParameters"

const defaults = {
  betaFeePercent: "0",
  betaVolumeCoefficient: "0",
  volumeRetentionPerHour: "1",
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
      volumeRetentionPerHour: "0.999999999999999999",
    })).toEqual({
      betaPhi0: 12345678901234567n,
      betaPhi1: 123456789012345678n,
      decayPerSecondWad: 1000000000000000000n,
    })
  })

  it("accepts both contract boundaries", () => {
    expect(parseBetaParameters({
      betaFeePercent: "100",
      betaVolumeCoefficient: "1",
      volumeRetentionPerHour: "0",
    })).toEqual({ betaPhi0: 10n ** 18n, betaPhi1: 10n ** 18n, decayPerSecondWad: 0n })
  })

  it.each([
    ["betaFeePercent", "100.0000000000000001"],
    ["betaFeePercent", "0.00000000000000001"],
    ["betaVolumeCoefficient", "1.000000000000000001"],
    ["betaVolumeCoefficient", "0.0000000000000000001"],
    ["volumeRetentionPerHour", "1.000000000000000001"],
    ["volumeRetentionPerHour", "0.0000000000000000001"],
    ["volumeRetentionPerHour", "-0.1"],
    ["betaFeePercent", "1e2"],
    ["betaVolumeCoefficient", "NaN"],
    ["betaFeePercent", ""],
  ])("rejects invalid %s value %s instead of rounding it", (field, value) => {
    expect(() => parseBetaParameters({ ...defaults, [field]: value })).toThrow()
  })
})

// Check the conversion's actual discrete contract result and its minimality.
import { retentionAfterHour, retentionPerSecond } from "@/utils/betaParameters"

describe("hourly retention conversion", () => {
  it.each([0n, 1n, 10n ** 12n, 5n * 10n ** 17n, 999n * 10n ** 15n, 10n ** 18n - 1n, 10n ** 18n])("retains at least the requested hourly amount %s", (hourly) => {
    const second = retentionPerSecond(hourly)
    expect(retentionAfterHour(second)).toBeGreaterThanOrEqual(hourly)
    if (second > 0n) expect(retentionAfterHour(second - 1n)).toBeLessThan(hourly)
  })
  it("does not confuse hourly retention with a per-second multiplier", () => {
    const second = retentionPerSecond(5n * 10n ** 17n)
    expect(second).toBeGreaterThan(999n * 10n ** 15n)
    expect(retentionAfterHour(second)).toBeLessThan(500000000000004000n)
    expect(retentionPerSecond(0n)).toBe(0n)
    expect(retentionPerSecond(10n ** 18n)).toBe(10n ** 18n)
  })
})
