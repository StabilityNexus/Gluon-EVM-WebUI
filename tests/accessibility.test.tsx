import React from "react"
import axe from "axe-core"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import OraclePreflightPanel from "@/components/OraclePreflightPanel"
import { ManagementActionCard } from "@/components/management-action-card"
import { ConversionInputs } from "@/app/[coinId]/components/ConversionInputs"

async function expectNoAxeViolations(container: HTMLElement) {
  const result = await axe.run(container, {
    rules: {
      "color-contrast": {
        enabled: false,
      },
    },
  })

  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([])
}

describe("accessibility", () => {
  it("has no automated WCAG violations in the oracle preflight panel", async () => {
    const { container } = render(
      <OraclePreflightPanel
        result={null}
        isChecking={false}
        error={null}
        onCheck={vi.fn()}
      />,
    )

    await expectNoAxeViolations(container)
  })

  it("has no automated WCAG violations in a management action form", async () => {
    const { container } = render(
      <ManagementActionCard
        title="Mint"
        description="Mint protocol tokens"
        icon={<span aria-hidden="true">+</span>}
        action="mint"
        coinSymbol="GLN"
        onAction={vi.fn()}
      />,
    )

    await expectNoAxeViolations(container)
  })

  it("has no automated WCAG violations in the conversion inputs", async () => {
    const { container } = render(
      <ConversionInputs
        model={{
          nativeAsset: undefined,
          useNativeBase: false,
          baseSymbolText: "WETH",
          fromBalanceDisplay: "0",
          fromToken: "BASE",
          setFromToken: vi.fn(),
          disabledTokens: { BASE: false, NEUTRON: false, PROTON: false, BUNDLE: false },
          baseAssetName: "Wrapped Ether",
          neutronSymbolText: "GUSD",
          protonSymbolText: "GLP",
          fromInputType: "text",
          fromInputPlaceholder: "0.0",
          fromInputValue: "",
          fromInputReadOnly: false,
          setAmount: vi.fn(),
          renderMaxButton: true,
          handleMaxClick: vi.fn(),
          toToken: "BUNDLE",
          setToToken: vi.fn(),
          breakdownPopover: null,
          toLabel: "",
          bundleLabel: "GUSD + GLP",
          activeBaseSymbol: "WETH",
          toInputType: "text",
          toInputPlaceholder: "0.0",
          toInputValue: "",
          toInputReadOnly: true,
        }}
      />,
    )

    expect(screen.getByRole("combobox", { name: "From token" })).toHaveTextContent("WETH")
    expect(screen.getByRole("combobox", { name: "To token" })).toHaveTextContent("GUSD + GLP")
    await expectNoAxeViolations(container)
  })
})
