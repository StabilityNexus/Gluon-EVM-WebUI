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

  it("discovers Sepolia reactors without enabling creation", () => {
    mocks.network.explorerFactoryAddress = "0x0000000000000000000000000000000000000005"
    render(<ExplorerPage />)
    expect(screen.getByRole("status")).toHaveTextContent("Sepolia test reactors")
    for (const [request] of mocks.read.mock.calls) {
      expect(request.address).toBe(mocks.network.explorerFactoryAddress)
      expect(request.query.enabled).toBe(true)
    }
    expect(mocks.network.factoryAddress).toBeUndefined()
  })

  it("prefers the current creation factory when configured", () => {
    mocks.network.factoryAddress = "0x0000000000000000000000000000000000000002"
    mocks.network.explorerFactoryAddress = "0x0000000000000000000000000000000000000005"
    render(<ExplorerPage />)
    for (const [request] of mocks.read.mock.calls) {
      expect(request.address).toBe(mocks.network.factoryAddress)
    }
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("shows an unavailable state and disables factory reads until configured", () => {
    render(<ExplorerPage />)
    expect(screen.getByRole("heading", { name: "No deployment configured" })).toBeInTheDocument()
    expect(mocks.read).toHaveBeenCalledTimes(2)
    for (const [request] of mocks.read.mock.calls) {
      expect(request.query.enabled).toBe(false)
    }
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
