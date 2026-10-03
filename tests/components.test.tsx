import React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OraclePreflightPanel from "@/components/OraclePreflightPanel"
import { ManagementActionCard } from "@/components/management-action-card"

describe("OraclePreflightPanel", () => {
  it("allows the user to start a preflight check", async () => {
    const user = userEvent.setup()
    const onCheck = vi.fn()

    render(
      <OraclePreflightPanel
        result={null}
        isChecking={false}
        error={null}
        onCheck={onCheck}
      />,
    )

    expect(screen.getByText("Required")).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Run Preflight" }),
    )

    expect(onCheck).toHaveBeenCalledOnce()
  })

  it("renders compatible oracle information", () => {
    render(
      <OraclePreflightPanel
        isChecking={false}
        error={null}
        onCheck={() => {}}
        result={{
          chainId: 11155111,
          address: "0x0000000000000000000000000000000000000001",
          status: "compatible",
          value: 1_000_000_000_000_000_000n,
          minValue: 900_000_000_000_000_000n,
          maxValue: 1_100_000_000_000_000_000n,
          ageSeconds: 3_660n,
          description: "Reference Oracle",
          issues: [],
          warnings: [],
        }}
      />,
    )

    expect(screen.getByText("Compatible")).toBeInTheDocument()
    expect(screen.getByText("Reference Oracle")).toBeInTheDocument()
    expect(screen.getByText("1h 1m ago")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Compatible with the current Gluon IOracle interface.",
      ),
    ).toBeInTheDocument()
  })

  it("collapses four failed interface reads into the compatibility message", () => {
    render(
      <OraclePreflightPanel
        isChecking={false}
        error={null}
        onCheck={() => {}}
        result={{
          chainId: 11155111,
          address: "0x0000000000000000000000000000000000000001",
          status: "blocked",
          issues: [
            "readValue() could not be read.",
            "readValueInterval() could not be read.",
            "lastUpdated() could not be read.",
            "description() could not be read.",
          ],
          warnings: [],
        }}
      />,
    )

    expect(
      screen.getByText(
        "Contract does not implement the required Gluon IOracle interface.",
      ),
    ).toBeInTheDocument()
  })
})

describe("ManagementActionCard", () => {
  it("submits a mint amount", async () => {
    const user = userEvent.setup()
    const onAction = vi.fn().mockResolvedValue(undefined)

    render(
      <ManagementActionCard
        title="Mint"
        description="Mint protocol tokens"
        icon={<span aria-hidden="true">+</span>}
        action="mint"
        coinSymbol="GLN"
        onAction={onAction}
      />,
    )

    await user.type(screen.getByLabelText("Amount"), "12.5")
    await user.click(
      screen.getByRole("button", { name: "Mint GLN" }),
    )

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith("mint", {
        amount: 12.5,
      })
    })

    expect(screen.getByLabelText("Amount")).toHaveValue(null)
  })

  it("includes the recipient for a transfer", async () => {
    const user = userEvent.setup()
    const onAction = vi.fn().mockResolvedValue(undefined)

    render(
      <ManagementActionCard
        title="Transfer"
        description="Transfer protocol tokens"
        icon={<span aria-hidden="true">→</span>}
        action="transfer"
        coinSymbol="GLN"
        onAction={onAction}
      />,
    )

    await user.type(screen.getByLabelText("Amount"), "4")
    await user.type(
      screen.getByLabelText("Recipient Address"),
      "0xabc123",
    )

    await user.click(
      screen.getByRole("button", { name: "Transfer GLN" }),
    )

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledWith("transfer", {
        amount: 4,
        recipient: "0xabc123",
      })
    })
  })
})
