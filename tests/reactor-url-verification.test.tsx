import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const mocks = vi.hoisted(() => ({
  chainId: 11155111,
  queryAddress: "0x00000000000000000000000000000000000000aa",
  currentFactory: undefined as `0x${string}` | undefined,
  explorerFactory: undefined as `0x${string}` | undefined,
  registeredAddresses: [] as string[],
  isPending: false,
  isError: false,
  read: vi.fn(),
  useReactorInteraction: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (name: string) => name === "coin" ? mocks.queryAddress : null }),
}))

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock("wagmi", () => ({
  useChainId: () => mocks.chainId,
  useReadContract: (request: unknown) => {
    mocks.read(request)
    return {
      data: mocks.registeredAddresses,
      isPending: mocks.isPending,
      isError: mocks.isError,
    }
  },
}))

vi.mock("@/utils/addresses", () => ({
  get StableCoinFactories() {
    return mocks.currentFactory ? { 11155111: mocks.currentFactory } : {}
  },
}))

vi.mock("@/utils/networks", () => ({
  getGluonNetwork: (chainId: number) =>
    chainId === 11155111 ? { explorerFactoryAddress: mocks.explorerFactory } : undefined,
}))

vi.mock("@/app/[coinId]/hooks/useReactorInteraction", () => ({
  useReactorInteraction: mocks.useReactorInteraction,
}))
vi.mock("@/app/[coinId]/components/InteractionHeader", () => ({
  InteractionHeader: () => <div data-testid="reactor-interaction" />,
}))
vi.mock("@/app/[coinId]/components/ReactorDashboard", () => ({
  ReactorDashboard: () => null,
}))
vi.mock("@/app/[coinId]/components/SwapForm", () => ({
  SwapForm: () => null,
}))
vi.mock("@/app/[coinId]/components/ReactorParameters", () => ({
  ReactorParameters: () => null,
}))
vi.mock("@/app/[coinId]/components/MissingReactorAddress", () => ({
  MissingReactorAddress: () => <div>No Reactor Address</div>,
}))

import InteractionClient from "@/app/[coinId]/InteractionClient"
import { FactoryABI } from "@/utils/abi/Factory"

const validReactor = "0x00000000000000000000000000000000000000aa"
const otherReactor = "0x00000000000000000000000000000000000000bb"
const primaryFactory = "0x0000000000000000000000000000000000000002"
const legacyFactory = "0x0000000000000000000000000000000000000005"

describe("reactor URL verification", () => {
  beforeEach(() => {
    mocks.chainId = 11155111
    mocks.queryAddress = validReactor
    mocks.currentFactory = primaryFactory
    mocks.explorerFactory = undefined
    mocks.registeredAddresses = []
    mocks.isPending = false
    mocks.isError = false
    mocks.read.mockReset()
    mocks.useReactorInteraction.mockReset()
    mocks.useReactorInteraction.mockReturnValue({ chainId: mocks.chainId })
  })

  it("blocks an unregistered reactor before mounting transaction hooks", () => {
    mocks.registeredAddresses = [otherReactor]
    render(<InteractionClient coinId="c" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Reactor not verified")
    expect(screen.queryByTestId("reactor-interaction")).not.toBeInTheDocument()
    expect(mocks.useReactorInteraction).not.toHaveBeenCalled()
    expect(screen.getByRole("link", { name: "Back to reactors" })).toHaveAttribute("href", "/explorer")
  })

  it("only mounts the interaction page for a factory-registered address", () => {
    mocks.registeredAddresses = [validReactor]
    render(<InteractionClient coinId="c" />)
    expect(screen.getByTestId("reactor-interaction")).toBeInTheDocument()
    expect(mocks.useReactorInteraction).toHaveBeenCalledWith(validReactor)
    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
      address: primaryFactory,
      chainId: 11155111,
      abi: FactoryABI,
      functionName: "getAllDeployedReactors",
      query: { enabled: true },
    }))
  })

  it("matches registered addresses without relying on case", () => {
    mocks.registeredAddresses = [validReactor.toUpperCase().replace(/^0X/, "0x")]
    render(<InteractionClient coinId="c" />)
    expect(screen.getByTestId("reactor-interaction")).toBeInTheDocument()
  })

  it("rejects malformed addresses before enabling the registry query", () => {
    mocks.queryAddress = "not-an-address"
    render(<InteractionClient coinId="c" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid reactor address")
    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
      query: { enabled: false },
    }))
    expect(mocks.useReactorInteraction).not.toHaveBeenCalled()
  })

  it("does not mount transaction hooks while verification is pending", () => {
    mocks.isPending = true
    mocks.registeredAddresses = []
    render(<InteractionClient coinId="c" />)
    expect(screen.getByRole("status")).toHaveTextContent("Verifying reactor")
    expect(mocks.useReactorInteraction).not.toHaveBeenCalled()
  })

  it("fails closed if the factory registry read fails even with cached addresses", () => {
    mocks.isError = true
    mocks.registeredAddresses = [validReactor]
    render(<InteractionClient coinId="c" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Reactor not verified")
    expect(mocks.useReactorInteraction).not.toHaveBeenCalled()
  })

  it("uses the configured legacy factory for Sepolia test reactors", () => {
    mocks.currentFactory = undefined
    mocks.explorerFactory = legacyFactory
    mocks.registeredAddresses = [validReactor]
    render(<InteractionClient coinId="c" />)
    expect(screen.getByTestId("reactor-interaction")).toBeInTheDocument()
    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
      address: legacyFactory,
      chainId: 11155111,
    }))
  })

  it("prefers the active factory, matching the Explorer", () => {
    mocks.explorerFactory = legacyFactory
    mocks.registeredAddresses = [validReactor]
    render(<InteractionClient coinId="c" />)
    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({ address: primaryFactory }))
  })

  it("blocks networks without a configured factory", () => {
    mocks.chainId = 1
    mocks.registeredAddresses = [validReactor]
    render(<InteractionClient coinId="c" />)
    expect(screen.getByRole("alert")).toHaveTextContent("No reactor factory configured")
    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
      chainId: 1,
      query: { enabled: false },
    }))
    expect(mocks.useReactorInteraction).not.toHaveBeenCalled()
  })

  it("blocks again after a wallet network switch", () => {
    mocks.registeredAddresses = [validReactor]
    const view = render(<InteractionClient coinId="c" />)
    expect(screen.getByTestId("reactor-interaction")).toBeInTheDocument()
    mocks.chainId = 1
    view.rerender(<InteractionClient coinId="c" />)
    expect(screen.queryByTestId("reactor-interaction")).not.toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("No reactor factory configured")
  })

  it("handles an empty query parameter", () => {
    mocks.queryAddress = ""
    render(<InteractionClient coinId="c" />)
    expect(screen.getByText("No Reactor Address")).toBeInTheDocument()
    expect(mocks.read).not.toHaveBeenCalled()
  })
})
