import { describe, expect, it } from "vitest"
import { mulDivUp } from "@/app/[coinId]/interactionUtils"

describe("proportional burn rounding", () => {
  it("returns the smallest integer covering the exact proportional amount", () => {
    for (const amount of [0n, 1n, 2n, 99n, (1n << 256n) - 1n]) {
      for (const supply of [1n, 3n, 10n ** 18n, (1n << 256n) - 1n]) {
        for (const reserve of [1n, 3n, 7n, 10n ** 18n]) {
          const burn = mulDivUp(amount, supply, reserve)
          expect(burn * reserve).toBeGreaterThanOrEqual(amount * supply)
          if (burn > 0n) {
            expect((burn - 1n) * reserve).toBeLessThan(amount * supply)
          }
        }
      }
    }
    expect(mulDivUp(1n, 1n, 0n)).toBe(0n)
  })
})
