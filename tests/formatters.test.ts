import { describe, expect, it } from "vitest"
import {
  formatNumber,
  formatPercentage,
  formatPrice,
} from "@/lib/demo-data"

describe("demo-data formatters", () => {
  it("formats large monetary values using readable units", () => {
    expect(formatNumber(1_500_000_000)).toBe("$1.5B")
    expect(formatNumber(2_500_000)).toBe("$2.5M")
    expect(formatNumber(4_200)).toBe("$4.2K")
    expect(formatNumber(12.3)).toBe("$12.30")
  })

  it("formats prices to three decimal places", () => {
    expect(formatPrice(1)).toBe("$1.000")
    expect(formatPrice(0.9974)).toBe("$0.997")
  })

  it("formats positive, zero and negative percentages", () => {
    expect(formatPercentage(1.234)).toBe("+1.23%")
    expect(formatPercentage(0)).toBe("+0.00%")
    expect(formatPercentage(-0.056)).toBe("-0.06%")
  })
})
