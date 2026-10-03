import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  chainId: 11155111,
  deployContractAsync: vi.fn(),
  writeContractAsync: vi.fn(),
}))

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: undefined,
    isConnected: false,
  }),
  useChainId: () => mocks.chainId,
  usePublicClient: () => ({}),
  useDeployContract: () => ({
    deployContractAsync: mocks.deployContractAsync,
    isPending: false,
  }),
  useWriteContract: () => ({
    data: undefined,
    isPending: false,
    writeContractAsync: mocks.writeContractAsync,
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: false,
    isSuccess: false,
  }),
}))

vi.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (props: {
        account: undefined
        chain: { unsupported: boolean }
        openConnectModal: () => void
        openChainModal: () => void
        mounted: boolean
      }) => React.ReactNode
    }) =>
      children({
        account: undefined,
        chain: { unsupported: false },
        openConnectModal: vi.fn(),
        openChainModal: vi.fn(),
        mounted: true,
      }),
  },
}))

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock("@/components/TokenSelector", () => ({
  default: () => <div data-testid="token-selector" />,
}))

vi.mock("@/components/PageHeader", () => ({
  PageHeader: () => null,
}))

vi.mock("@/components/OraclePreflightPanel", () => ({
  default: () => <div data-testid="oracle-preflight" />,
}))

import CreatePage from "@/app/create/page"

function getOracleInput() {
  const label = screen.getByText("Orb Oracle Address")
  const input = label.parentElement?.querySelector("input")

  if (!input) {
    throw new Error("Orb Oracle input was not rendered")
  }

  return input as HTMLInputElement
}

describe("Orb oracle provider", () => {
  beforeEach(() => {
    mocks.chainId = 11155111
    vi.clearAllMocks()
  })

  it("uses an Orb address directly without showing Chainlink adapter deployment", async () => {
    const user = userEvent.setup()

    render(<CreatePage />)

    expect(
      screen.getByRole("button", { name: "Existing Adapter" }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole("button", { name: "Chainlink" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Orb" }))

    expect(screen.getByText("Orb Oracle Address")).toBeInTheDocument()

    expect(
      screen.getByText(/no adapter deployment is required/i),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole("button", { name: "Deploy Chainlink Adapter" }),
    ).not.toBeInTheDocument()

    const orbAddress = "0x0000000000000000000000000000000000000001"
    const oracleInput = getOracleInput()

    await user.type(oracleInput, orbAddress)

    expect(oracleInput).toHaveValue(orbAddress)
    expect(screen.getByTestId("oracle-preflight")).toBeInTheDocument()
  })

  it("clears stale oracle state when switching providers", async () => {
    const user = userEvent.setup()

    render(<CreatePage />)

    await user.click(screen.getByRole("button", { name: "Orb" }))

    const orbAddress = "0x0000000000000000000000000000000000000001"
    await user.type(getOracleInput(), orbAddress)

    expect(getOracleInput()).toHaveValue(orbAddress)

    await user.click(screen.getByRole("button", { name: "Chainlink" }))

    expect(screen.getByText("Chainlink Feed Address")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Deploy Chainlink Adapter" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Orb" }))

    expect(getOracleInput()).toHaveValue("")
  })

  it("invalidates an Orb address when the network changes", async () => {
    const user = userEvent.setup()

    const { rerender } = render(<CreatePage />)

    await user.click(screen.getByRole("button", { name: "Orb" }))

    const orbAddress = "0x0000000000000000000000000000000000000001"
    await user.type(getOracleInput(), orbAddress)

    expect(getOracleInput()).toHaveValue(orbAddress)

    mocks.chainId = 534351
    rerender(<CreatePage />)

    await waitFor(() => {
      expect(getOracleInput()).toHaveValue("")
    })

    expect(
      screen.getByRole("button", { name: "Orb" }),
    ).toHaveAttribute("aria-pressed", "true")
  })
})
