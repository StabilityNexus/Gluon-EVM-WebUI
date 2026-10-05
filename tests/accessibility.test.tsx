import React from "react"
import axe from "axe-core"
import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import OraclePreflightPanel from "@/components/OraclePreflightPanel"
import { ManagementActionCard } from "@/components/management-action-card"
import Footer from "@/components/Footer"

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

  it("has no automated WCAG violations in the site footer", async () => {
    const { container } = render(
      <Footer onTermsClick={vi.fn()} onShareClick={vi.fn()} />,
    )

    await expectNoAxeViolations(container)
  })
})
