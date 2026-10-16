import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

const mocks = vi.hoisted(() => ({
  network: {
    chain: { id: 11155111 },
    displayName: "Test network",
    factoryAddress: undefined as `0x${string}` | undefined,
  },
  read: vi.fn(),
}))

vi.mock("wagmi", () => ({
  useChainId: () => 11155111,
  useReadContract: mocks.read,
}))
vi.mock("@/utils/networks", () => ({ GLUON_NETWORKS: [mocks.network] }))
vi.mock("@/utils/addresses", () => ({
  get StableCoinFactories() {
    return mocks.network.factoryAddress ? { 11155111: mocks.network.factoryAddress } : {}
  },
}))

import ExplorerPage from "@/app/explorer/page"
import { FactoryABI } from "@/utils/abi/Factory"

describe("current factory explorer", () => {
  beforeEach(() => {
    mocks.network.factoryAddress = undefined
    mocks.read.mockReset()
    mocks.read.mockImplementation(({ functionName }: { functionName: string }) => ({
      data: functionName === "getAllDeployedReactors" ? [] : 0n,
      refetch: vi.fn(),
    }))
  })

  it("shows an unavailable state and disables factory reads until configured", () => {
    render(<ExplorerPage />)
    expect(screen.getByRole("heading", { name: "No deployment configured" })).toBeInTheDocument()
    expect(mocks.read).toHaveBeenCalledTimes(2)
    for (const [request] of mocks.read.mock.calls) {
      expect(request.query.enabled).toBe(false)
    }
  })

  it("uses the same current ABI for explorer reads once a factory is configured", () => {
    mocks.network.factoryAddress = "0x0000000000000000000000000000000000000002"
    render(<ExplorerPage />)
    expect(screen.getByRole("heading", { name: "Reactor explorer" })).toBeInTheDocument()
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
