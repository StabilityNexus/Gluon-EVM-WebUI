import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"

const mocks = vi.hoisted(() => ({
  connected: false,
  reconnecting: false,
  chain: undefined as { id: number; name: string } | undefined,
  pending: false,
  error: null as Error | null,
  switchChain: vi.fn(),
  reset: vi.fn(),
}))

vi.mock("@stability-nexus/walletlink", () => ({
  useWalletLink: () => ({
    isConnected: mocks.connected,
    isReconnecting: mocks.reconnecting,
    chain: mocks.chain,
  }),
  WalletLinkButton: () => <button type="button">Account menu</button>,
  WalletLinkModal: ({
    open,
    onOpenChange,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
  }) => open ? (
    <div role="dialog" aria-label="Wallet picker">
      <button type="button" onClick={() => onOpenChange(false)}>Close picker</button>
    </div>
  ) : null,
}))

vi.mock("wagmi", () => ({
  useSwitchChain: () => ({
    chains: [
      { id: 11155111, name: "Ethereum Sepolia" },
      { id: 534351, name: "Scroll Sepolia" },
    ],
    switchChain: mocks.switchChain,
    isPending: mocks.pending,
    error: mocks.error,
    reset: mocks.reset,
  }),
}))

import { WalletButton } from "@/components/WalletButton"

describe("WalletLink wallet controls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.connected = false
    mocks.reconnecting = false
    mocks.chain = undefined
    mocks.pending = false
    mocks.error = null
  })

  it("opens and closes the wallet picker from an action button", () => {
    render(<WalletButton mode="action" />)
    fireEvent.click(screen.getByRole("button", { name: "Connect Wallet" }))
    expect(screen.getByRole("dialog", { name: "Wallet picker" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Close picker" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(mocks.switchChain).not.toHaveBeenCalled()
  })

  it("disables connection while restoring a wallet session", () => {
    mocks.reconnecting = true
    render(<WalletButton />)
    expect(screen.getByRole("button", { name: "Loading wallet" })).toBeDisabled()
  })

  it("does not show a mobile network control while disconnected", () => {
    const view = render(<WalletButton mode="network" />)
    expect(view.container).toBeEmptyDOMElement()
  })

  it("keeps the account menu and opens the supported-network selector", async () => {
    mocks.connected = true
    mocks.chain = { id: 11155111, name: "Ethereum Sepolia" }
    render(<WalletButton />)
    expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Network: Ethereum Sepolia/ }))
    fireEvent.click(screen.getByRole("button", { name: "Scroll Sepolia" }))
    expect(mocks.switchChain).toHaveBeenCalledWith(
      { chainId: 534351 },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
    act(() => {
      mocks.switchChain.mock.calls[0][1].onSuccess()
    })
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("shows an unsupported wallet chain instead of a fallback network", () => {
    mocks.connected = true
    render(<WalletButton />)
    expect(screen.getByRole("button", { name: "Wrong network. Switch network" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument()
  })

  it("offers network switching from an action on an unsupported chain", () => {
    mocks.connected = true
    render(<WalletButton mode="action" />)
    fireEvent.click(screen.getByRole("button", { name: "Wrong network. Switch network" }))
    expect(screen.getByRole("button", { name: "Ethereum Sepolia" })).toBeEnabled()
  })

  it("disables network choices while the wallet is processing a switch", () => {
    mocks.connected = true
    mocks.pending = true
    render(<WalletButton mode="network" />)
    fireEvent.click(screen.getByRole("button", { name: "Wrong network. Switch network" }))
    expect(screen.getByRole("button", { name: "Ethereum Sepolia" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Scroll Sepolia" })).toBeDisabled()
    expect(screen.getByRole("status")).toHaveTextContent("Confirm the network change")
  })

  it("keeps the selector usable after a rejected network switch", () => {
    mocks.connected = true
    mocks.error = new Error("User rejected the request")
    render(<WalletButton mode="network" />)
    fireEvent.click(screen.getByRole("button", { name: "Wrong network. Switch network" }))
    expect(screen.getByRole("alert")).toHaveTextContent("Could not switch network")
    expect(screen.getByRole("button", { name: "Ethereum Sepolia" })).toBeEnabled()
  })

  it("closes the network selector when the wallet disconnects", async () => {
    mocks.connected = true
    const view = render(<WalletButton />)
    fireEvent.click(screen.getByRole("button", { name: "Wrong network. Switch network" }))
    mocks.connected = false
    view.rerender(<WalletButton />)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByRole("button", { name: "Connect Wallet" })).toBeEnabled()
  })
})
