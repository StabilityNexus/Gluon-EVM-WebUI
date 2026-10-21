import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { encodeAbiParameters, keccak256, toHex } from "viem"

const mocks = vi.hoisted(() => ({
  values: [
    1500000000000000000n,
    1030000000000000000n,
    2000000000000000000n,
    10n ** 36n,
    1000000n,
  ] as (bigint | undefined)[],
  account: {
    address: "0x1111111111111111111111111111111111111111",
    isConnected: true,
    chain: { id: 11155111 },
  },
  read: vi.fn(),
  simulate: vi.fn(),
  write: vi.fn(),
  receipt: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))
vi.mock("wagmi", () => ({
  useAccount: () => mocks.account,
  usePublicClient: () => ({
    readContract: mocks.read,
    simulateContract: mocks.simulate,
    waitForTransactionReceipt: mocks.receipt,
  }),
  useReadContracts: () => ({
    data: mocks.values.map((result) => ({
      status: result === undefined ? "failure" : "success",
      result,
    })),
    refetch: mocks.refresh,
  }),
  useWriteContract: () => ({
    writeContractAsync: mocks.write,
    isPending: false,
  }),
}))
vi.mock("sonner", () => ({
  toast: { success: mocks.success, error: mocks.error, info: mocks.info },
}))
import { ReactorDashboard } from "@/app/[coinId]/components/ReactorDashboard"

const reactor = "0x2222222222222222222222222222222222222222"
const onAdjusted = vi.fn()
const view = () => (
  <ReactorDashboard
    reactorAddress={reactor}
    chainId={11155111}
    baseDecimals={6}
    baseSymbol="USDC"
    onAdjusted={onAdjusted}
  />
)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.values = [
    15n * 10n ** 17n,
    103n * 10n ** 16n,
    2n * 10n ** 18n,
    10n ** 36n,
    1000000n,
  ]
  mocks.account = {
    address: "0x1111111111111111111111111111111111111111",
    isConnected: true,
    chain: { id: 11155111 },
  }
  mocks.read.mockResolvedValue(101n * 10n ** 16n)
  mocks.simulate.mockResolvedValue({
    request: {
      address: reactor,
      functionName: "adjustPeg",
      account: mocks.account.address,
    },
  })
  mocks.write.mockResolvedValue(`0x${"a".repeat(64)}`)
  mocks.receipt.mockResolvedValue({
    status: "success",
    logs: [
      {
        address: reactor,
        topics: [keccak256(toHex("PegAdjusted(uint256,uint256,uint256)"))],
        data: encodeAbiParameters(
          [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
          [10n ** 36n, 99n * 10n ** 34n, 101n * 10n ** 16n],
        ),
      },
    ],
  })
})

describe("reactor dashboard", () => {
  it("uses token decimals and labels derived spot metrics without inventing a yield", () => {
    render(view())
    expect(screen.getByText("1 USDC")).toBeInTheDocument()
    expect(
      screen.getByRole("img", {
        name: "Approximate reserve split between stable claims and volatile surplus",
      }),
    ).toBeInTheDocument()
    expect(screen.getByText("3×")).toBeInTheDocument()
    expect(screen.getByText("31.3%")).toBeInTheDocument()
    expect(screen.getByText("Historical data required")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Adjust peg" }),
    ).not.toBeInTheDocument()
  })
  it.each([103n * 10n ** 16n, 2n * 10n ** 18n])(
    "treats operating bound %s as inclusive",
    (ratio) => {
      mocks.values[0] = ratio
      render(view())
      expect(
        screen.queryByRole("button", { name: "Adjust peg" }),
      ).not.toBeInTheDocument()
    },
  )
  it("preserves zero reserve and does not guess missing metrics", () => {
    mocks.values = [undefined, undefined, undefined, undefined, 0n]
    render(view())
    expect(screen.getByText("0 USDC")).toBeInTheDocument()
    expect(screen.getAllByText("—")).toHaveLength(4)
    expect(
      screen.queryByRole("button", { name: "Adjust peg" }),
    ).not.toBeInTheDocument()
  })
  it.each(["disconnected", "wrong chain"])(
    "does not submit with %s wallet",
    (state) => {
      mocks.values[0] = 101n * 10n ** 16n
      if (state === "disconnected") mocks.account.isConnected = false
      else mocks.account.chain.id = 1
      render(view())
      fireEvent.click(screen.getByRole("button", { name: "Adjust peg" }))
      expect(mocks.write).not.toHaveBeenCalled()
      expect(mocks.error).toHaveBeenCalled()
    },
  )
  it("rechecks the live ratio and skips a now-unnecessary adjustment", async () => {
    mocks.values[0] = 101n * 10n ** 16n
    mocks.read.mockResolvedValue(15n * 10n ** 17n)
    render(view())
    fireEvent.click(screen.getByRole("button", { name: "Adjust peg" }))
    await waitFor(() => expect(mocks.info).toHaveBeenCalled())
    expect(mocks.write).not.toHaveBeenCalled()
  })
  it("simulates adjustPeg, waits for success and refreshes the displayed state", async () => {
    mocks.values[0] = 101n * 10n ** 16n
    render(view())
    fireEvent.click(screen.getByRole("button", { name: "Adjust peg" }))
    await waitFor(() => expect(onAdjusted).toHaveBeenCalledOnce())
    expect(mocks.simulate).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "adjustPeg", address: reactor }),
    )
    expect(mocks.write).toHaveBeenCalledWith(
      expect.objectContaining({ functionName: "adjustPeg", chainId: 11155111 }),
    )
    expect(mocks.refresh).toHaveBeenCalled()
    expect(mocks.success).toHaveBeenCalled()
  })
  it.each(["rejected", "reverted", "no change", "unconfirmed"])(
    "reports %s without claiming an adjustment",
    async (state) => {
      mocks.values[0] = 101n * 10n ** 16n
      if (state === "rejected")
        mocks.write.mockRejectedValue(new Error("User rejected"))
      else if (state === "unconfirmed")
        mocks.receipt.mockRejectedValue(new Error("RPC unavailable"))
      else
        mocks.receipt.mockResolvedValue({
          status: state === "reverted" ? "reverted" : "success",
          logs: [],
        })
      render(view())
      fireEvent.click(screen.getByRole("button", { name: "Adjust peg" }))
      await waitFor(() =>
        expect(
          state === "no change" ? mocks.info : mocks.error,
        ).toHaveBeenCalled(),
      )
      expect(mocks.success).not.toHaveBeenCalled()
    },
  )
  it("stops if the account changes while simulation is pending", async () => {
    mocks.values[0] = 101n * 10n ** 16n
    let resolve!: (value: unknown) => void
    mocks.simulate.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const rendered = render(view())
    fireEvent.click(screen.getByRole("button", { name: "Adjust peg" }))
    await waitFor(() => expect(mocks.simulate).toHaveBeenCalled())
    mocks.account = {
      ...mocks.account,
      address: "0x3333333333333333333333333333333333333333",
    }
    rendered.rerender(view())
    resolve({ request: {} })
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(
        "Wallet or network changed. Please try again.",
      ),
    )
    expect(mocks.write).not.toHaveBeenCalled()
  })
})
