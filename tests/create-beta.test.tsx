import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

const mocks = vi.hoisted(() => ({
  account: "0x0000000000000000000000000000000000000001",
  factoryAddress: "0x0000000000000000000000000000000000000002",
  network: {
    chain: { id: 11155111 },
    displayName: "Test network",
    factoryAddress: "0x0000000000000000000000000000000000000002",
    factorySupportsInitialReserve: true,
    factorySupportsImmutableBeta: true,
  },
  writeContractAsync: vi.fn(),
  runOraclePreflight: vi.fn(),
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: mocks.account, isConnected: true }),
  useChainId: () => 11155111,
  usePublicClient: () => ({
    readContract: mocks.readContract,
    waitForTransactionReceipt: mocks.waitForTransactionReceipt,
  }),
  useDeployContract: () => ({ deployContractAsync: vi.fn(), isPending: false }),
  useWriteContract: () => ({ writeContractAsync: mocks.writeContractAsync, isPending: false }),
  useWaitForTransactionReceipt: () => ({ isLoading: false, isSuccess: false }),
}))

vi.mock("@/utils/networks", () => ({ GLUON_NETWORKS: [mocks.network], SEPOLIA_CHAIN_ID: 11155111 }))
vi.mock("@/utils/addresses", () => ({ StableCoinFactories: { 11155111: mocks.factoryAddress } }))
vi.mock("@/utils/oraclePreflight", () => ({ runOraclePreflight: mocks.runOraclePreflight }))
vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: { error: mocks.toastError, success: vi.fn(), info: vi.fn() },
}))
vi.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (props: object) => React.ReactNode }) => children({
      account: { address: mocks.account },
      chain: { unsupported: false },
      mounted: true,
      openConnectModal: vi.fn(),
      openChainModal: vi.fn(),
    }),
  },
}))
vi.mock("@/components/TokenSelector", () => ({
  default: ({ value, onChange }: { value: string; onChange: (address: string) => void }) => (
    <input aria-label="Base token address" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}))

import CreatePage from "@/app/create/page"
import { ImmutableBetaFactoryABI } from "@/utils/abi/ImmutableBetaFactory"

async function fillRequiredFields() {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText("Gold Backed Vault"), "Test Vault")
  await user.type(screen.getByPlaceholderText("Bitcoin Reserve"), "USD Coin")
  await user.type(screen.getByPlaceholderText("BTC"), "USDC")
  await user.type(screen.getByLabelText("Base token address"), "0x0000000000000000000000000000000000000003")
  await user.type(screen.getAllByPlaceholderText("0x...")[0], "0x0000000000000000000000000000000000000004")
  const names = screen.getAllByPlaceholderText("Token Name")
  const symbols = screen.getAllByPlaceholderText("SYMBOL")
  await user.type(names[0], "Neutron")
  await user.type(names[1], "Proton")
  await user.type(symbols[0], "N")
  await user.type(symbols[1], "P")
  await user.click(screen.getByRole("button", { name: "Run Preflight" }))
  await waitFor(() => expect(screen.getByRole("button", { name: "Deploy Reactor" })).toBeEnabled())
  return user
}

describe("reactor creation with immutable beta settings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.network.factorySupportsInitialReserve = true
    mocks.network.factorySupportsImmutableBeta = true
    mocks.writeContractAsync.mockResolvedValue(`0x${"a".repeat(64)}`)
    mocks.waitForTransactionReceipt.mockResolvedValue({ status: "success" })
    mocks.readContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === "decimals") return Promise.resolve(6)
      if (functionName === "allowance") return Promise.resolve(0n)
      throw new Error(`Unexpected read ${functionName}`)
    })
    mocks.runOraclePreflight.mockImplementation((_client, address, chainId) => Promise.resolve({
      address, chainId, status: "compatible", issues: [], warnings: [], value: 10n ** 18n,
    }))
  })

  it("approves the reserve using token decimals and sends the chosen beta values", async () => {
    render(<CreatePage />)
    const user = await fillRequiredFields()
    for (const [name, value] of [
      ["Base transmutation fee (%)", "1.2345678901234567"],
      ["Volume fee coefficient", "0.5"],
      ["Volume retained each second", "0.999999999999999999"],
    ]) {
      const input = screen.getByLabelText(name)
      await user.clear(input)
      await user.type(input, value)
    }
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    await waitFor(() => expect(mocks.writeContractAsync).toHaveBeenCalledTimes(2))

    expect(mocks.writeContractAsync.mock.calls[0][0]).toMatchObject({
      functionName: "approve", args: [mocks.factoryAddress, 100000n],
    })
    const deployment = mocks.writeContractAsync.mock.calls[1][0]
    expect(deployment.abi).toBe(ImmutableBetaFactoryABI)
    expect(deployment.functionName).toBe("deployReactor")
    expect(deployment.args).toHaveLength(17)
    expect(deployment.args.slice(13)).toEqual([
      100000n, 12345678901234567n, 500000000000000000n, 999999999999999999n,
    ])
  })

  it("submits explicit no-fee and no-decay defaults", async () => {
    render(<CreatePage />)
    const user = await fillRequiredFields()
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    await waitFor(() => expect(mocks.writeContractAsync).toHaveBeenCalledTimes(2))
    expect(mocks.writeContractAsync.mock.calls[1][0].args.slice(14)).toEqual([0n, 0n, 10n ** 18n])
  })

  it.each([true, false])("preserves the older factory signature with initial reserve support %s", async (initialReserve) => {
    mocks.network.factorySupportsImmutableBeta = false
    mocks.network.factorySupportsInitialReserve = initialReserve
    render(<CreatePage />)
    expect(screen.queryByRole("group", { name: "Transmutation settings" })).not.toBeInTheDocument()
    const user = await fillRequiredFields()
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    await waitFor(() => expect(mocks.writeContractAsync).toHaveBeenCalledTimes(initialReserve ? 2 : 1))
    const deployment = mocks.writeContractAsync.mock.calls.at(-1)![0]
    expect(deployment.functionName).toBe("deployReactor")
    expect(deployment.args).toHaveLength(initialReserve ? 14 : 13)
    expect(deployment.abi).not.toBe(ImmutableBetaFactoryABI)
  })

  it("rejects invalid settings before requesting reserve approval", async () => {
    render(<CreatePage />)
    const user = await fillRequiredFields()
    const retention = screen.getByLabelText("Volume retained each second")
    await user.clear(retention)
    await user.type(retention, "1.000000000000000001")
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    expect(mocks.toastError).toHaveBeenCalledWith("Volume retention exceeds its allowed maximum")
    expect(mocks.writeContractAsync).not.toHaveBeenCalled()
  })

  it("does not deploy when reserve approval is rejected", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.writeContractAsync.mockRejectedValueOnce(new Error("User rejected"))
    render(<CreatePage />)
    const user = await fillRequiredFields()
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Failed to deploy reactor"))
    expect(mocks.writeContractAsync).toHaveBeenCalledTimes(1)
    expect(mocks.writeContractAsync.mock.calls[0][0].functionName).toBe("approve")
    log.mockRestore()
  })

  it("gives the new settings accessible names and explanations", async () => {
    render(<CreatePage />)
    const group = screen.getByRole("group", { name: "Transmutation settings" })
    expect(screen.getByLabelText("Base transmutation fee (%)")).toHaveAccessibleDescription(/Between 0 and 100/)
    expect(screen.getByLabelText("Volume retained each second")).toHaveAccessibleDescription(/Use 1 for no decay/)
    const results = await axe.run(group, { rules: { "color-contrast": { enabled: false } } })
    expect(results.violations).toEqual([])
  })
})
