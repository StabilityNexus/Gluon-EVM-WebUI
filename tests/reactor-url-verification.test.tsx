import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const mocks = vi.hoisted(() => ({
  chainId: 11155111,
  queryAddress: "0x00000000000000000000000000000000000000aa",
  currentFactory: undefined as `0x${string}` | undefined,
  explorerFactory: undefined as `0x${string}` | undefined,
  mainnetFactory: undefined as `0x${string}` | undefined,
  registeredAddresses: [] as string[],
  historicalAddresses: [] as string[],
  isPending: false,
  isError: false,
  historicalPending: false,
  historicalError: false,
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
  useReadContract: (request: {
    address?: `0x${string}`
    chainId?: number
    query?: { enabled?: boolean }
  }) => {
    mocks.read(request)

    const isHistorical =
      request.chainId === 11155111 &&
      !!mocks.currentFactory &&
      !!mocks.explorerFactory &&
      mocks.currentFactory.toLowerCase() !==
        mocks.explorerFactory.toLowerCase() &&
      request.address?.toLowerCase() ===
        mocks.explorerFactory.toLowerCase()

    const pending = isHistorical
      ? mocks.historicalPending : mocks.isPending
    const error = isHistorical
      ? mocks.historicalError : mocks.isError
    const enabled = request.query?.enabled === true

    return {
      data: isHistorical
        ? mocks.historicalAddresses : mocks.registeredAddresses,
      isPending: enabled ? pending : true,
      isError: enabled ? error : false,
      isSuccess: enabled && !pending && !error,
    }
  },
}))

vi.mock("@/utils/addresses", () => ({
  get StableCoinFactories() {
    return {
      ...(mocks.currentFactory ? { 11155111: mocks.currentFactory } : {}),
      ...(mocks.mainnetFactory ? { 1: mocks.mainnetFactory } : {}),
    }
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
    mocks.mainnetFactory = undefined
    mocks.registeredAddresses = []
    mocks.historicalAddresses = []
    mocks.isPending = false
    mocks.isError = false
    mocks.historicalPending = false
    mocks.historicalError = false
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

  it("accepts historical-only membership with both Sepolia factories configured", () => {
    mocks.explorerFactory = legacyFactory
    mocks.registeredAddresses = []
    mocks.historicalAddresses = [validReactor]

    render(<InteractionClient coinId="c" />)

    expect(screen.getByTestId("reactor-interaction")).toBeInTheDocument()
    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
      address: primaryFactory,
      chainId: 11155111,
      query: { enabled: true },
    }))
    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
      address: legacyFactory,
      chainId: 11155111,
      query: { enabled: true },
    }))
  })

  it("accepts current-only membership with both registries configured", () => {
    mocks.explorerFactory = legacyFactory
    mocks.registeredAddresses = [validReactor]
    mocks.historicalAddresses = [otherReactor]

    render(<InteractionClient coinId="c" />)

    expect(screen.getByTestId("reactor-interaction")).toBeInTheDocument()
    expect(mocks.useReactorInteraction).toHaveBeenCalledWith(validReactor)
  })

  it("blocks an address absent from both trusted registries", () => {
    mocks.explorerFactory = legacyFactory
    mocks.registeredAddresses = [otherReactor]
    mocks.historicalAddresses = []

    render(<InteractionClient coinId="c" />)

    expect(screen.getByRole("alert")).toHaveTextContent("Reactor not verified")
    expect(mocks.useReactorInteraction).not.toHaveBeenCalled()
  })

  it("allows a successful historical verification if the current read fails", () => {
    mocks.explorerFactory = legacyFactory
    mocks.isError = true
    mocks.registeredAddresses = [validReactor]
    mocks.historicalAddresses = [validReactor]

    render(<InteractionClient coinId="c" />)

    expect(screen.getByTestId("reactor-interaction")).toBeInTheDocument()
  })

  it("does not trust cached historical membership after that read fails", () => {
    mocks.explorerFactory = legacyFactory
    mocks.registeredAddresses = []
    mocks.historicalAddresses = [validReactor]
    mocks.historicalError = true

    render(<InteractionClient coinId="c" />)

    expect(screen.getByRole("alert")).toHaveTextContent("Reactor not verified")
    expect(mocks.useReactorInteraction).not.toHaveBeenCalled()
  })

  it("fails closed when both registries fail despite cached membership", () => {
    mocks.explorerFactory = legacyFactory
    mocks.registeredAddresses = [validReactor]
    mocks.historicalAddresses = [validReactor]
    mocks.isError = true
    mocks.historicalError = true

    render(<InteractionClient coinId="c" />)

    expect(screen.getByRole("alert")).toHaveTextContent("Reactor not verified")
    expect(mocks.useReactorInteraction).not.toHaveBeenCalled()
  })

  it("waits while historical verification is pending after a current read failure", () => {
    mocks.explorerFactory = legacyFactory
    mocks.isError = true
    mocks.historicalPending = true

    const view = render(<InteractionClient coinId="c" />)

    expect(screen.getByRole("status")).toHaveTextContent("Verifying reactor")
    expect(mocks.useReactorInteraction).not.toHaveBeenCalled()

    mocks.historicalPending = false
    mocks.historicalAddresses = [validReactor]
    view.rerender(<InteractionClient coinId="c" />)

    expect(screen.getByTestId("reactor-interaction")).toBeInTheDocument()
  })

  it("re-verifies on network switch even when the factory address is the same", () => {
    mocks.explorerFactory = legacyFactory
    mocks.registeredAddresses = []
    mocks.historicalAddresses = [validReactor]
    mocks.mainnetFactory = primaryFactory

    const view = render(<InteractionClient coinId="c" />)
    expect(screen.getByTestId("reactor-interaction")).toBeInTheDocument()

    mocks.chainId = 1
    view.rerender(<InteractionClient coinId="c" />)

    expect(screen.getByRole("alert")).toHaveTextContent("Reactor not verified")
    expect(screen.queryByTestId("reactor-interaction")).not.toBeInTheDocument()
    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
      address: primaryFactory,
      chainId: 1,
      query: { enabled: true },
    }))
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
