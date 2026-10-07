import React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OraclePreflightPanel from "@/components/OraclePreflightPanel"
import { ManagementActionCard } from "@/components/management-action-card"
import Footer from "@/components/Footer"

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

describe("Footer", () => {
  it("renders product, resources, community, and legal navigation columns", () => {
    render(<Footer onTermsClick={vi.fn()} onShareClick={vi.fn()} />)

    expect(screen.getByRole("navigation", { name: "Footer" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Product" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Resources" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Community" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Legal" })).toBeInTheDocument()

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/")
    expect(screen.getByRole("link", { name: "Create Stablecoin" })).toHaveAttribute("href", "/create")
    expect(screen.getByRole("link", { name: "Explore Reactors" })).toHaveAttribute("href", "/explorer")
  })

  it("handles Terms of Use and Share button interactions", async () => {
    const user = userEvent.setup()
    const onTermsClick = vi.fn()
    const onShareClick = vi.fn()

    render(<Footer onTermsClick={onTermsClick} onShareClick={onShareClick} />)

    await user.click(screen.getByRole("button", { name: "Terms of Use" }))
    expect(onTermsClick).toHaveBeenCalledOnce()

    await user.click(screen.getByRole("button", { name: "Share WebUI" }))
    expect(onShareClick).toHaveBeenCalledOnce()
  })

  it("renders accessible social links", () => {
    render(<Footer onTermsClick={vi.fn()} />)

    const xLinks = screen.getAllByRole("link", { name: "X (Twitter)" })
    expect(xLinks.length).toBeGreaterThanOrEqual(1)
    expect(xLinks[0]).toHaveAttribute("href", "https://x.com/StabilityNexus")

    const discordLinks = screen.getAllByRole("link", { name: "Discord" })
    expect(discordLinks.length).toBeGreaterThanOrEqual(1)
    expect(discordLinks[0]).toHaveAttribute("href", "https://discord.gg/YzDKeEfWtS")

    const telegramLinks = screen.getAllByRole("link", { name: "Telegram" })
    expect(telegramLinks.length).toBeGreaterThanOrEqual(1)
    expect(telegramLinks[0]).toHaveAttribute("href", "https://t.me/StabilityNexus")

    const githubLinks = screen.getAllByRole("link", { name: "GitHub" })
    expect(githubLinks.length).toBeGreaterThanOrEqual(1)
    expect(githubLinks[0]).toHaveAttribute("href", "https://github.com/StabilityNexus")
  })
})
