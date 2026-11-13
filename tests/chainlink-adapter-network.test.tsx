import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const FEED = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
const ADAPTER = "0x0000000000000000000000000000000000000002"

const mocks = vi.hoisted(() => ({
  chainId: 1,
  account: {
    address: "0x0000000000000000000000000000000000000001" as string | undefined,
    isConnected: true,
    chain: { id: 1 } as { id: number } | undefined,
  },
  deployContractAsync: vi.fn(),
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  runOraclePreflight: vi.fn(),
}))

vi.mock("wagmi", () => ({
  useAccount: () => mocks.account,
  useReadContract: () => ({ data: undefined }),
  useChainId: () => mocks.chainId,
  usePublicClient: () => ({
    readContract: mocks.readContract,
    waitForTransactionReceipt: mocks.waitForTransactionReceipt,
  }),
  useDeployContract: () => ({
    deployContractAsync: mocks.deployContractAsync,
    isPending: false,
  }),
  useWriteContract: () => ({
    data: undefined,
    isPending: false,
    writeContractAsync: vi.fn(),
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: false,
    isSuccess: false,
  }),
}))

vi.mock("@/components/WalletButton", () => ({
  WalletButton: () => <button type="button" onClick={() => {}}>Connect Wallet</button>,
}))

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}))

vi.mock("@/utils/oraclePreflight", () => ({
  runOraclePreflight: mocks.runOraclePreflight,
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

async function enterChainlinkFeed() {
  const user = userEvent.setup()
  render(<CreatePage />)

  await user.click(screen.getByRole("button", { name: "Chainlink" }))

  const input = screen
    .getByText("Chainlink Feed Address")
    .parentElement?.querySelector("input")
  if (!input) {
    throw new Error("Chainlink feed input was not rendered")
  }
  await user.type(input, FEED)

  return {
    user,
    deployButton: screen.getByRole("button", { name: "Deploy Chainlink Adapter" }),
  }
}

describe("Chainlink adapter deployment network", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.chainId = 1
    mocks.account = {
      address: "0x0000000000000000000000000000000000000001",
      isConnected: true,
      chain: { id: 1 },
    }
    mocks.readContract.mockImplementation(({ functionName }: { functionName: string }) =>
      functionName === "decimals"
        ? Promise.resolve(8)
        : Promise.resolve([1n, 300000000000n, 0n, 0n, 1n]),
    )
    mocks.deployContractAsync.mockResolvedValue(`0x${"ab".repeat(32)}`)
    mocks.waitForTransactionReceipt.mockResolvedValue({
      status: "success",
      contractAddress: ADAPTER,
    })
    mocks.runOraclePreflight.mockResolvedValue({
      chainId: 1,
      address: ADAPTER,
      status: "compatible",
      issues: [],
      warnings: [],
    })
  })

  it("pins the adapter deployment to the selected network", async () => {
    const { user, deployButton } = await enterChainlinkFeed()

    expect(deployButton).toBeEnabled()
    await user.click(deployButton)

    await waitFor(() => {
      expect(mocks.deployContractAsync).toHaveBeenCalledWith(
        expect.objectContaining({ chainId: 1, args: [FEED] }),
      )
    })
  })

  it("blocks deployment while the wallet is on an unconfigured chain", async () => {
    // wagmi leaves useChainId() on the last configured chain and
    // useAccount().chain undefined when the wallet uses an unconfigured chain.
    mocks.account = { ...mocks.account, chain: undefined }

    const { user, deployButton } = await enterChainlinkFeed()

    expect(deployButton).toBeDisabled()
    expect(
      screen.getByText("Switch your wallet to Ethereum to deploy the adapter."),
    ).toBeInTheDocument()

    await user.click(deployButton)

    expect(mocks.readContract).not.toHaveBeenCalled()
    expect(mocks.deployContractAsync).not.toHaveBeenCalled()
  })

  it("does not report a wrong network when no wallet is connected", async () => {
    mocks.account = { address: undefined, isConnected: false, chain: undefined }

    const { deployButton } = await enterChainlinkFeed()

    expect(deployButton).toBeEnabled()
    expect(screen.queryByText(/Switch your wallet to/)).not.toBeInTheDocument()
  })
})
