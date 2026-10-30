import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const mocks = vi.hoisted(() => ({
  chainId: 11155111,
  network: {
    chain: { id: 11155111, blockExplorers: { default: { url: "https://sepolia.etherscan.io" } } },
    displayName: "Test network",
    factoryAddress: undefined as `0x${string}` | undefined,
    explorerFactoryAddress: undefined as `0x${string}` | undefined,
  },
  read: vi.fn(),
}))

vi.mock("wagmi", () => ({
  useChainId: () => mocks.chainId,
  useReadContract: mocks.read,
}))
vi.mock("@/utils/networks", () => ({ GLUON_NETWORKS: [mocks.network], SEPOLIA_CHAIN_ID: 11155111 }))
vi.mock("@/utils/addresses", () => ({
  get StableCoinFactories() {
    return mocks.network.factoryAddress ? { 11155111: mocks.network.factoryAddress } : {}
  },
}))

import ExplorerPage from "@/app/explorer/page"
import { FactoryABI } from "@/utils/abi/Factory"

describe("current factory explorer", () => {
  beforeEach(() => {
    mocks.chainId = 11155111
    mocks.network.factoryAddress = undefined
    mocks.network.explorerFactoryAddress = undefined
    mocks.read.mockReset()
    mocks.read.mockImplementation(({ functionName }: { functionName: string }) => ({
      data: functionName === "getAllDeployedReactors" ? [] : 0n,
      refetch: vi.fn(),
    }))
  })

  it("discovers historical Sepolia reactors when only the old Factory is configured", () => {
    const historical = "0x0000000000000000000000000000000000000005"
    mocks.network.explorerFactoryAddress = historical

    render(<ExplorerPage />)

    expect(screen.getByRole("status")).toHaveTextContent(
      "Sepolia includes historical test reactors"
    )

    expect(mocks.read).toHaveBeenCalledTimes(3)

    const calls = mocks.read.mock.calls.map(([request]) => request)
    const active = calls.filter((request) => request.query.enabled)

    expect(active).toHaveLength(2)
    expect(active.every((request) => request.address === historical)).toBe(true)
    expect(mocks.network.factoryAddress).toBeUndefined()
  })

  it("reads both current and historical Sepolia registries", () => {
    const current = "0x0000000000000000000000000000000000000002"
    const historical = "0x0000000000000000000000000000000000000005"

    mocks.network.factoryAddress = current
    mocks.network.explorerFactoryAddress = historical

    render(<ExplorerPage />)

    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
      address: current,
      functionName: "getAllDeployedReactors",
      query: { enabled: true },
    }))

    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
      address: historical,
      functionName: "getAllDeployedReactors",
      query: { enabled: true },
    }))

    expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
      address: current,
      functionName: "getDeployedReactorsCount",
      query: { enabled: true },
    }))

    expect(screen.getByRole("status")).toHaveTextContent(
      "New reactor creation uses the current verified Factory"
    )
  })

  it("shows the unavailable state with all registry reads disabled", () => {
    render(<ExplorerPage />)

    expect(screen.getByRole("heading", {
      name: "No deployment configured",
    })).toBeInTheDocument()

    expect(mocks.read).toHaveBeenCalledTimes(3)

    for (const [request] of mocks.read.mock.calls) {
      expect(request.query.enabled).toBe(false)
    }
  })

  it("merges current and historical Reactors without duplicates", () => {
    const current = "0x0000000000000000000000000000000000000002"
    const historical = "0x0000000000000000000000000000000000000005"
    const first = "0x0000000000000000000000000000000000000011"
    const shared = "0x0000000000000000000000000000000000000012"
    const older = "0x0000000000000000000000000000000000000013"

    mocks.network.factoryAddress = current
    mocks.network.explorerFactoryAddress = historical

    mocks.read.mockImplementation(({
      address, functionName,
    }: {
      address?: string
      functionName: string
    }) => ({
      data: functionName === "getAllDeployedReactors"
        ? address === current
          ? [first, shared]
          : address === historical
            ? [shared, older]
            : []
        : undefined,
      refetch: vi.fn(),
    }))

    render(<ExplorerPage />)

    expect(screen.getAllByRole("link", {
      name: /Open reactor/i,
    })).toHaveLength(3)
  })

  it("keeps current Reactors visible if historical discovery fails", () => {
    const current = "0x0000000000000000000000000000000000000002"
    const historical = "0x0000000000000000000000000000000000000005"
    const reactor = "0x0000000000000000000000000000000000000011"

    mocks.network.factoryAddress = current
    mocks.network.explorerFactoryAddress = historical

    mocks.read.mockImplementation(({
      address, functionName,
    }: {
      address?: string
      functionName: string
    }) => ({
      data: functionName === "getAllDeployedReactors" && address === current
        ? [reactor]
        : undefined,
      error: functionName === "getAllDeployedReactors" && address === historical
        ? new Error("Historical RPC unavailable")
        : null,
      refetch: vi.fn(),
    }))

    render(<ExplorerPage />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Results may be incomplete"
    )
    expect(screen.getByRole("link", {
      name: /Open reactor/i,
    })).toBeInTheDocument()
    expect(screen.queryByText("Unable to load reactors")).not.toBeInTheDocument()
  })

  it("keeps historical Reactors visible if the current registry fails", () => {
    const current = "0x0000000000000000000000000000000000000002"
    const historical = "0x0000000000000000000000000000000000000005"
    const reactor = "0x0000000000000000000000000000000000000013"

    mocks.network.factoryAddress = current
    mocks.network.explorerFactoryAddress = historical

    mocks.read.mockImplementation(({
      address, functionName,
    }: {
      address?: string
      functionName: string
    }) => ({
      data: functionName === "getAllDeployedReactors" && address === historical
        ? [reactor]
        : undefined,
      error: functionName === "getAllDeployedReactors" && address === current
        ? new Error("Current RPC unavailable")
        : null,
      refetch: vi.fn(),
    }))

    render(<ExplorerPage />)

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Results may be incomplete"
    )
    expect(screen.getByRole("link", {
      name: /Open reactor/i,
    })).toBeInTheDocument()
    expect(screen.queryByText("Unable to load reactors")).not.toBeInTheDocument()
  })

  it("links reactor and reserve addresses and labels the two coins", () => {
    mocks.network.factoryAddress = "0x0000000000000000000000000000000000000002"
    const reactor = "0x0000000000000000000000000000000000000003"
    const reserve = "0x0000000000000000000000000000000000000004"
    mocks.read.mockImplementation(({ functionName }: { functionName: string }) => ({
      data: functionName === "getAllDeployedReactors" ? [reactor]
        : functionName === "BASE_TOKEN" ? reserve
        : functionName === "vaultName" ? "Test reactor"
        : functionName === "getDeployedReactorsCount" ? 1n
        : functionName === "symbol" ? "TEST" : reactor,
      refetch: vi.fn(),
    }))
    const { container } = render(<ExplorerPage />)
    expect(screen.getByText("Stable Coin")).toBeInTheDocument()
    expect(screen.getByText("Volatile Coin")).toBeInTheDocument()
    expect(container.querySelector(`a[href="https://sepolia.etherscan.io/address/${reactor}"]`)).toBeInTheDocument()
    expect(container.querySelector(`a[href="https://sepolia.etherscan.io/address/${reserve}"]`)).toBeInTheDocument()
  })

  it("uses the same current ABI for explorer reads once a factory is configured", () => {
    mocks.network.factoryAddress = "0x0000000000000000000000000000000000000002"
    render(<ExplorerPage />)
    expect(screen.getByRole("heading", { name: "Reactors" })).toBeInTheDocument()
    for (const functionName of ["getAllDeployedReactors", "getDeployedReactorsCount"]) {
      expect(mocks.read).toHaveBeenCalledWith(expect.objectContaining({
        address: mocks.network.factoryAddress,
        abi: FactoryABI,
        functionName,
        query: { enabled: true },
      }))
    }
  })
})
