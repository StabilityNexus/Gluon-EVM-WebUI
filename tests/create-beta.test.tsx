import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axe from "axe-core"

const mocks = vi.hoisted(() => ({
  account: "0x0000000000000000000000000000000000000001",
  factoryAddress: "0x0000000000000000000000000000000000000002",
  network: {
    chain: { id: 11155111 },
    displayName: "Test network",
    factoryAddress: "0x0000000000000000000000000000000000000002" as `0x${string}` | undefined,
  },
  writeContractAsync: vi.fn(),
  runOraclePreflight: vi.fn(),
  readContract: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: mocks.account,
    isConnected: true,
    chain: { id: 11155111 },
  }),
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
vi.mock("@/utils/addresses", () => ({
  get StableCoinFactories() {
    return mocks.network.factoryAddress ? { 11155111: mocks.network.factoryAddress } : {}
  },
}))
vi.mock("@/utils/oraclePreflight", () => ({ runOraclePreflight: mocks.runOraclePreflight }))
vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: { error: mocks.toastError, success: vi.fn(), info: vi.fn() },
}))
vi.mock("@/components/WalletButton", () => ({
  WalletButton: () => <button type="button" onClick={() => {}}>Connect Wallet</button>,
}))
vi.mock("@/components/TokenSelector", () => ({
  default: ({ value, onChange }: { value: string; onChange: (address: string) => void }) => (
    <input aria-label="Base token address" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}))

import CreatePage from "@/app/create/page"
import { FactoryABI } from "@/utils/abi/Factory"

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
    mocks.network.factoryAddress = mocks.factoryAddress as `0x${string}`
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
    expect(deployment.abi).toBe(FactoryABI)
    expect(deployment.functionName).toBe("deployReactor")
    expect(deployment.args.slice(9, 11)).toEqual([
      "0x86B8f920835015c0F1b697dBe0B8b150a986eCE5",
      1_000_000_000_000_000n,
    ])
    expect(deployment.args).toHaveLength(18)
    expect(deployment.args.slice(14)).toEqual([
      100000n, 12345678901234567n, 500000000000000000n, 999999999999999999n,
    ])
  })

  it("submits explicit no-fee and no-decay defaults", async () => {
    render(<CreatePage />)
    const user = await fillRequiredFields()
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    await waitFor(() => expect(mocks.writeContractAsync).toHaveBeenCalledTimes(2))
    expect(mocks.writeContractAsync.mock.calls[1][0].args.slice(15)).toEqual([0n, 0n, 10n ** 18n])
  })

  it("disables deployment when no current factory is configured", () => {
    mocks.network.factoryAddress = undefined
    render(<CreatePage />)
    expect(screen.getByRole("status")).toHaveTextContent("Reactor deployment is not yet available")
    expect(screen.getByRole("button", { name: "Deploy Reactor" })).toBeDisabled()
    expect(mocks.writeContractAsync).not.toHaveBeenCalled()
  })

  it("passes the chosen initial dev and the fixed dev fee", async () => {
    render(<CreatePage />)
    const user = await fillRequiredFields()
    const dev = screen.getByLabelText("Initial Dev and Fee Receiver")
    await user.clear(dev)
    await user.type(dev, "0x0000000000000000000000000000000000000005")
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    await waitFor(() => expect(mocks.writeContractAsync).toHaveBeenCalledTimes(2))
    expect(mocks.writeContractAsync.mock.calls[1][0].args.slice(9, 11)).toEqual([
      "0x0000000000000000000000000000000000000005",
      1_000_000_000_000_000n,
    ])
  })

  it("rejects a zero dev before asking for approval", async () => {
    render(<CreatePage />)
    const user = await fillRequiredFields()
    fireEvent.change(screen.getByLabelText("Initial Dev and Fee Receiver"), {
      target: { value: "0x0000000000000000000000000000000000000000" },
    })
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    expect(mocks.toastError).toHaveBeenCalledWith("Dev must be a valid nonzero address")
    expect(mocks.writeContractAsync).not.toHaveBeenCalled()
  })

  it("rejects a protocol fee that reaches 100% with the dev fee", async () => {
    render(<CreatePage />)
    const user = await fillRequiredFields()
    fireEvent.change(screen.getByLabelText("Fission Fee (%)"), { target: { value: "99.9" } })
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    expect(mocks.toastError).toHaveBeenCalledWith("Each fission or fusion fee plus the 0.1% dev fee must be below 100%")
    expect(mocks.writeContractAsync).not.toHaveBeenCalled()
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

  it.each(["0.0000001", "0.0000009", "0.1234567", "1e-7"])(
    "rejects initial reserve %s before approval or deployment",
    async (value) => {
      render(<CreatePage />)
      const user = await fillRequiredFields()
      fireEvent.change(screen.getByPlaceholderText("0.1"), { target: { value } })
      await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
      await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(
        "Initial reserve must be a decimal with at most 6 decimal places"
      ))
      expect(mocks.writeContractAsync).not.toHaveBeenCalled()
      expect(mocks.readContract.mock.calls.some(([call]) => call.functionName === "allowance")).toBe(false)
    }
  )

  it("accepts the smallest reserve unit without rounding", async () => {
    render(<CreatePage />)
    const user = await fillRequiredFields()
    fireEvent.change(screen.getByPlaceholderText("0.1"), { target: { value: "0.000001" } })
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    await waitFor(() => expect(mocks.writeContractAsync).toHaveBeenCalledTimes(2))
    expect(mocks.writeContractAsync.mock.calls[0][0].args).toEqual([mocks.factoryAddress, 1n])
    expect(mocks.writeContractAsync.mock.calls[1][0].args[14]).toBe(1n)
  })

  it("rejects a zero initial reserve before approval or deployment", async () => {
    render(<CreatePage />)
    const user = await fillRequiredFields()
    fireEvent.change(screen.getByPlaceholderText("0.1"), { target: { value: "0" } })
    await user.click(screen.getByRole("button", { name: "Deploy Reactor" }))
    expect(mocks.toastError).toHaveBeenCalledWith("Initial reserve must be greater than zero")
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
