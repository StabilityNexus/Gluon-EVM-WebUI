import type { ReactNode } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { parseUnits } from "viem"
import InteractionClient from "@/app/[coinId]/InteractionClient"

const mocks = vi.hoisted(() => ({
  reactor: "0x1111111111111111111111111111111111111111",
  wallet: "0x2222222222222222222222222222222222222222",
  recipient: "0x3333333333333333333333333333333333333333",
  base: "0x4444444444444444444444444444444444444444",
  neutron: "0x5555555555555555555555555555555555555555",
  proton: "0x6666666666666666666666666666666666666666",
  address: "0x2222222222222222222222222222222222222222",
  chainId: 11155111,
  connected: true,
  native: false,
  coin: null as string | null,
  decimals: 18,
  allowance: 0n,
  reserve: 300n * 10n ** 18n as bigint | undefined,
  neutronSupply: 100n * 10n ** 18n,
  protonSupply: 100n * 10n ** 18n,
  neutronBalance: 12123456789000000000n as bigint | undefined,
  protonBalance: 12123456789000000000n as bigint | undefined,
  fee: 10n ** 16n,
  devFee: 0n as bigint | undefined,
  quoteOutput: 900000000000000123n as bigint | undefined,
  quoteFetching: false,
  quoteError: false,
  quoteUpdatedAt: 0,
  approving: false,
  receiptSuccess: false,
  refetch: vi.fn(),
  refetchPricing: vi.fn(),
  write: vi.fn(),
  writeNative: vi.fn(),
  send: vi.fn(),
  waitReceipt: vi.fn(),
  read: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  openConnect: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => mocks.coin }),
}))

vi.mock("wagmi", () => ({
  useReadContracts: () => ({ data: undefined, refetch: vi.fn() }),
  useAccount: () => ({
    address: mocks.connected ? mocks.address : undefined,
    isConnected: mocks.connected,
    chain: mocks.connected ? { id: mocks.chainId } : undefined,
  }),
  useChainId: () => mocks.chainId,
  useBalance: () => ({
    data: { value: 5n * 10n ** 18n, decimals: 18 },
    refetch: mocks.refetch,
  }),
  useReadContract: ({
    address,
    functionName,
  }: {
    address: string
    functionName: string
  }) => {
    const wad = 10n ** 18n
    const data: Record<string, unknown> = {
      getAllDeployedReactors: [mocks.reactor],
      vaultName: "Test",
      ORACLE: mocks.recipient,
      BASE_TOKEN: mocks.base,
      NEUTRON_TOKEN: mocks.neutron,
      PROTON_TOKEN: mocks.proton,
      dev: mocks.recipient,
      devFeeReceiver: mocks.recipient,
      devFee: mocks.devFee,
      baseAssetName: "Wrapped Ether",
      baseAssetSymbol: "WETH",
      peggedAssetName: "Dollar",
      peggedAssetSymbol: "USD",
      decimals: mocks.decimals,
      symbol:
        address === mocks.neutron
          ? "N"
          : address === mocks.proton
            ? "P"
            : "WETH",
      totalSupply:
        address === mocks.neutron ? mocks.neutronSupply : mocks.protonSupply,
      reserve: mocks.reserve,
      balanceOf:
        address === mocks.neutron
          ? mocks.neutronBalance
          : address === mocks.proton
            ? mocks.protonBalance
            : parseUnits("12.123456789", mocks.decimals),
      allowance: mocks.allowance,
      FISSION_FEE: mocks.fee,
      FUSION_FEE: mocks.fee,
      CRITICAL_RESERVE_RATIO: 2n * wad,
      getBasePriceInPeggedAsset: wad,
      reserveRatioPeggedAsset: 3n * wad,
      neutronPriceInBase: wad,
      protonPriceInBase: 2n * wad,
    }
    const pricingRead = [
      "getBasePriceInPeggedAsset",
      "reserveRatioPeggedAsset",
      "neutronPriceInBase",
      "protonPriceInBase",
    ].includes(functionName)
    return {
      data: data[functionName],
      isPending: false,
      isError: false,
      refetch: pricingRead ? mocks.refetchPricing : mocks.refetch,
    }
  },
  useSimulateContract: () => ({
    data: mocks.quoteOutput === undefined ? undefined : { result: [mocks.quoteOutput, 0n] },
    isFetching: mocks.quoteFetching,
    isError: mocks.quoteError,
    dataUpdatedAt: mocks.quoteUpdatedAt,
  }),
  useWriteContract: () => ({
    writeContract: mocks.write,
    writeContractAsync: mocks.writeNative,
    isPending: mocks.approving,
  }),
  useSendTransaction: () => ({ sendTransactionAsync: mocks.send }),
  usePublicClient: () => ({
    waitForTransactionReceipt: mocks.waitReceipt,
    readContract: mocks.read,
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: false,
    isSuccess: mocks.receiptSuccess,
  }),
}))

vi.mock("@/utils/networks", () => ({
  GLUON_NETWORKS: [{
    chain: { id: 11155111 },
    factoryAddress: "0x0000000000000000000000000000000000000002",
  }],
  getGluonNetwork: () => ({
    chain: { id: mocks.chainId },
    nativeAsset: mocks.native
      ? {
          nativeSymbol: "ETH",
          nativeDecimals: 18,
          wrappedNativeAddress: mocks.base,
        }
      : undefined,
  }),
}))

vi.mock("sonner", () => ({
  toast: { success: mocks.success, error: mocks.error },
}))

vi.mock("@/components/WalletButton", () => ({
  WalletButton: () => <button type="button" onClick={mocks.openConnect}>Connect Wallet</button>,
}))

// Exercise the page's controlled values and handlers independently of Radix's
// portal/pointer implementation, which is already tested by that library.
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (value: string) => void
    children: ReactNode
  }) => (
    <select
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({
    children,
    value,
    disabled,
  }: {
    children: ReactNode
    value: string
    disabled?: boolean
  }) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
}))

function inputAmount(value = "1") {
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value } })
}

function chooseFrom(value: string) {
  fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value } })
}

function setRecipient(value: string) {
  fireEvent.change(screen.getByPlaceholderText("0x..."), { target: { value } })
}

function renderPage() {
  return render(<InteractionClient coinId={mocks.reactor} />)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.address = mocks.wallet
  mocks.chainId = 11155111
  mocks.connected = true
  mocks.native = false
  mocks.coin = null
  mocks.decimals = 18
  mocks.allowance = 0n
  mocks.reserve = 300n * 10n ** 18n
  mocks.neutronSupply = 100n * 10n ** 18n
  mocks.protonSupply = 100n * 10n ** 18n
  mocks.neutronBalance = 12123456789000000000n
  mocks.protonBalance = 12123456789000000000n
  mocks.fee = 10n ** 16n
  mocks.devFee = 0n
  mocks.quoteOutput = 900000000000000123n
  mocks.quoteFetching = false
  mocks.quoteError = false
  mocks.quoteUpdatedAt = 0
  mocks.approving = false
  mocks.receiptSuccess = false
  mocks.write.mockReset()
  mocks.writeNative.mockReset().mockResolvedValue("0xabc")
  mocks.send.mockReset().mockResolvedValue("0xdef")
  mocks.waitReceipt.mockReset().mockResolvedValue({ status: "success" })
  mocks.read.mockReset().mockResolvedValue(0n)
})

describe("reactor interaction", () => {

  it.each([
    ["Neutron", false],
    ["Proton", false],
    ["Neutron", true],
    ["Proton", true],
  ] as const)(
    "blocks fusion when %s is one raw unit short (native: %s)",
    (token, native) => {
      mocks.native = native
      mocks.fee = 0n
      // A withdrawal of 1 against reserve 300 and supply 100 requires ceil(1/3).
      if (token === "Neutron") mocks.neutronBalance = 333333333333333333n
      else mocks.protonBalance = 333333333333333333n

      renderPage()
      chooseFrom("BUNDLE")
      if (native) fireEvent.click(screen.getByRole("button", { name: "ETH (native)" }))
      inputAmount()
      fireEvent.click(screen.getByRole("button", {
        name: native ? "Redeem ETH" : "Merge Tokens",
      }))

      expect(mocks.error).toHaveBeenCalledWith(
        "Not enough Neutron or Proton for this withdrawal. Try a smaller amount.",
      )
      expect(mocks.write).not.toHaveBeenCalled()
      expect(mocks.writeNative).not.toHaveBeenCalled()
      expect(mocks.send).not.toHaveBeenCalled()
    },
  )

  it.each(["neutronBalance", "protonBalance", "reserve"] as const)(
    "does not submit fusion while %s is unavailable",
    (field) => {
      mocks[field] = undefined
      renderPage()
      chooseFrom("BUNDLE")
      inputAmount()
      fireEvent.click(screen.getByRole("button", { name: "Merge Tokens" }))

      expect(mocks.error).toHaveBeenCalledWith(
        "Fusion quote or token balances unavailable. Please try again.",
      )
      expect(mocks.write).not.toHaveBeenCalled()
      expect(mocks.writeNative).not.toHaveBeenCalled()
    },
  )

  it.each([false, true])(
    "accepts a smaller redemption after mint-down rounding (native: %s)",
    async (native) => {
      const wad = 10n ** 18n
      mocks.native = native
      mocks.fee = 0n
      // State after a 100-base seed followed by a fee-free 1-base deposit.
      mocks.reserve = 101n * wad
      mocks.neutronBalance = 666666666666666666n
      mocks.protonBalance = 333333333333333333n
      mocks.neutronSupply = 66666666666666666666n + mocks.neutronBalance
      mocks.protonSupply = 33333333333333333333n + mocks.protonBalance

      renderPage()
      chooseFrom("BUNDLE")
      if (native) fireEvent.click(screen.getByRole("button", { name: "ETH (native)" }))
      inputAmount()
      const label = native ? "Redeem ETH" : "Merge Tokens"
      fireEvent.click(screen.getByRole("button", { name: label }))

      expect(mocks.error).toHaveBeenCalledWith(
        "Not enough Neutron or Proton for this withdrawal. Try a smaller amount.",
      )
      expect(mocks.write).not.toHaveBeenCalled()
      expect(mocks.writeNative).not.toHaveBeenCalled()

      // One base unit less requires exactly the available token balances.
      inputAmount("0.999999999999999999")
      fireEvent.click(screen.getByRole("button", { name: label }))

      if (native) {
        await waitFor(() => expect(mocks.success).toHaveBeenCalledWith(
          "Neutron + proton redeemed for ETH",
        ))
      }

      expect(native ? mocks.writeNative : mocks.write).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: "fusion",
          args: [wad - 1n, mocks.wallet],
        }),
      )
    },
  )
  it("unwraps only the native amount left after both fees", async () => {
    mocks.native = true
    mocks.devFee = 10n ** 15n
    renderPage()
    chooseFrom("BUNDLE")
    fireEvent.click(screen.getByRole("button", { name: "ETH (native)" }))
    inputAmount()
    fireEvent.click(screen.getByRole("button", { name: "Redeem ETH" }))
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith("Neutron + proton redeemed for ETH"))
    const gross = mocks.writeNative.mock.calls[0][0].args[0] as bigint
    const actual = gross * (10n ** 18n - mocks.fee - mocks.devFee) / 10n ** 18n
    expect(actual).toBeGreaterThanOrEqual(10n ** 18n)
    expect(mocks.writeNative.mock.calls[1][0]).toMatchObject({ functionName: "withdraw", args: [actual] })
  })
  it("preserves the missing-address screen and query-address entry point", () => {
    const view = render(<InteractionClient coinId="c" />)
    expect(
      screen.getByRole("heading", { name: "No Reactor Address" }),
    ).toBeInTheDocument()
    mocks.coin = mocks.reactor
    view.rerender(<InteractionClient coinId="c" />)
    expect(
      screen.getByRole("heading", { name: "Test Reactor" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Reactor Parameters")).toBeInTheDocument()
  })

  it("shows wallet connection without submitting a transaction", () => {
    mocks.connected = false
    renderPage()
    fireEvent.click(screen.getByRole("button", { name: "Connect Wallet" }))
    expect(mocks.openConnect).toHaveBeenCalledOnce()
    expect(mocks.write).not.toHaveBeenCalled()
  })

  it("updates an untouched default recipient when the wallet changes", () => {
    const view = renderPage()
    expect(screen.getByPlaceholderText("0x...")).toHaveValue(mocks.wallet)
    mocks.address = mocks.base
    view.rerender(<InteractionClient coinId={mocks.reactor} />)
    expect(screen.getByPlaceholderText("0x...")).toHaveValue(mocks.base)
    mocks.address = mocks.wallet
    view.rerender(<InteractionClient coinId={mocks.reactor} />)
    expect(screen.getByPlaceholderText("0x...")).toHaveValue(mocks.wallet)
  })

  it("defaults the recipient once and preserves edits when the wallet changes", () => {
    const view = renderPage()
    expect(screen.getByPlaceholderText("0x...")).toHaveValue(mocks.wallet)
    setRecipient(mocks.recipient)
    mocks.address = mocks.base
    view.rerender(<InteractionClient coinId={mocks.reactor} />)
    expect(screen.getByPlaceholderText("0x...")).toHaveValue(mocks.recipient)
  })

  it("approves the exact ERC20 input amount using its configured decimals", () => {
    mocks.decimals = 6
    renderPage()
    inputAmount("1.25")
    fireEvent.click(screen.getByRole("button", { name: "Approve WETH" }))
    expect(mocks.write).toHaveBeenCalledWith(
      expect.objectContaining({
        address: mocks.base,
        functionName: "approve",
        args: [mocks.reactor, 1250000n],
      }),
    )
  })

  it("disables approval while a transaction is pending", () => {
    mocks.approving = true
    renderPage()
    inputAmount()
    expect(screen.getByRole("button", { name: "Approving…" })).toBeDisabled()
  })

  it("runs ERC20 fission after sufficient allowance and keeps native mode hidden", () => {
    mocks.allowance = 2n * 10n ** 18n
    renderPage()
    expect(screen.queryByText("Base asset mode")).not.toBeInTheDocument()
    inputAmount()
    fireEvent.click(screen.getByRole("button", { name: "Split Base" }))
    expect(mocks.write).toHaveBeenCalledWith(
      expect.objectContaining({
        address: mocks.reactor,
        functionName: "fission",
        args: [10n ** 18n, mocks.wallet],
      }),
    )
  })

  it("requests net ERC20 fusion output with fusion and developer fees on top", () => {
    mocks.fee = 7n * 10n ** 15n
    mocks.devFee = 1n * 10n ** 15n
    renderPage()
    fireEvent.click(
      screen.getByRole("button", { name: "Reverse conversion direction" }),
    )
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("BUNDLE")
    expect(screen.getAllByRole("combobox")[1]).toHaveValue("BASE")
    inputAmount("0.002")
    fireEvent.click(screen.getByRole("button", { name: "Merge Tokens" }))
    const gross = 2016129032258065n
    expect(mocks.write).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "fusion",
        args: [gross, mocks.wallet],
      }),
    )
    const net = gross * (10n ** 18n - mocks.fee - mocks.devFee) / 10n ** 18n
    expect(net).toBeGreaterThanOrEqual(2n * 10n ** 15n)
  })

  it.each([
    ["PROTON", "NEUTRON", "Transmutation β⁺", "transmuteProtonToNeutron"],
    ["NEUTRON", "PROTON", "Transmutation β⁻", "transmuteNeutronToProton"],
  ])(
    "runs %s transmutation with the paired target",
    async (from, to, label, functionName) => {
      const view = renderPage()
      chooseFrom(from)
      expect(screen.getAllByRole("combobox")[1]).toHaveValue(to)

      mocks.quoteFetching = true
      inputAmount("2")

      // Model completion of a fresh simulation for this amount.
      mocks.quoteUpdatedAt = 1
      mocks.quoteFetching = false
      view.rerender(<InteractionClient coinId={mocks.reactor} />)

      await waitFor(() => {
        expect(
          screen.getByText(/Minimum received: 0.900000000000000123/),
        ).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole("button", { name: label }))
      expect(mocks.write).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName,
          account: mocks.wallet,
          chainId: mocks.chainId,
          args: [2n * 10n ** 18n, mocks.quoteOutput, mocks.wallet],
        }),
      )
    },
  )

  it.each(["PROTON", "NEUTRON"])("blocks %s transmutation without a usable quote", (from) => {
    const view = renderPage()
    chooseFrom(from)
    inputAmount("2")
    const label = from === "PROTON" ? "Transmutation β⁺" : "Transmutation β⁻"
    for (const change of [
      { quoteFetching: true, quoteError: false, quoteOutput: 900000000000000123n },
      { quoteFetching: false, quoteError: true, quoteOutput: 900000000000000123n },
      { quoteFetching: false, quoteError: false, quoteOutput: undefined },
      { quoteFetching: false, quoteError: false, quoteOutput: 0n },
    ]) {
      Object.assign(mocks, change)
      view.rerender(<InteractionClient coinId={mocks.reactor} />)
      fireEvent.click(screen.getByRole("button", { name: label }))
      expect(mocks.write).not.toHaveBeenCalled()
      expect(mocks.error).toHaveBeenLastCalledWith("Output quote unavailable. Check the amount, balance and reactor status, then try again.")
    }
  })

  it("preserves Max rounding and recipient validation", () => {
    mocks.allowance = 100n * 10n ** 18n
    renderPage()
    fireEvent.click(screen.getByRole("button", { name: "Max" }))
    expect(screen.getByRole("spinbutton")).toHaveValue(12.123456)
    setRecipient("invalid")
    fireEvent.click(screen.getByRole("button", { name: "Split Base" }))
    expect(mocks.error).toHaveBeenCalledWith("Enter a valid recipient address")
    expect(mocks.write).not.toHaveBeenCalled()
  })

  it("refreshes state and clears the amount after confirmed transactions", () => {
    mocks.allowance = 100n * 10n ** 18n
    const view = renderPage()
    inputAmount()
    mocks.receiptSuccess = true
    view.rerender(<InteractionClient coinId={mocks.reactor} />)
    expect(screen.getByRole("spinbutton")).toHaveValue(null)
    expect(mocks.refetch).toHaveBeenCalled()
    expect(mocks.refetchPricing).toHaveBeenCalledTimes(4)
  })

  it("wraps, conditionally approves, and fissions native input in order", async () => {
    mocks.native = true
    renderPage()
    fireEvent.click(screen.getByRole("button", { name: "ETH (native)" }))
    expect(
      screen.queryByRole("button", { name: "Max" }),
    ).not.toBeInTheDocument()
    inputAmount()
    fireEvent.click(screen.getByRole("button", { name: "Split ETH" }))
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith(
        "ETH converted into neutron + proton",
      ),
    )
    expect(
      mocks.writeNative.mock.calls.map(([call]) => call.functionName),
    ).toEqual(["deposit", "approve", "fission"])
    expect(mocks.writeNative).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ value: 10n ** 18n }),
    )
    expect(mocks.waitReceipt).toHaveBeenCalledTimes(3)
    expect(mocks.refetchPricing).toHaveBeenCalledTimes(4)
    expect(screen.getByRole("spinbutton")).toHaveValue(null)
  })

  it("skips wrapped-native approval when the live allowance is sufficient", async () => {
    mocks.native = true
    mocks.read.mockResolvedValue(2n * 10n ** 18n)
    renderPage()
    fireEvent.click(screen.getByRole("button", { name: "ETH (native)" }))
    inputAmount()
    fireEvent.click(screen.getByRole("button", { name: "Split ETH" }))
    await waitFor(() =>
      expect(mocks.success).toHaveBeenCalledWith(
        "ETH converted into neutron + proton",
      ),
    )
    expect(
      mocks.writeNative.mock.calls.map(([call]) => call.functionName),
    ).toEqual(["deposit", "fission"])
  })

  it.each([false, true])(
    "fuses and unwraps native output; forwards only for a different recipient (%s)",
    async (differentRecipient) => {
      mocks.native = true
      renderPage()
      chooseFrom("BUNDLE")
      fireEvent.click(screen.getByRole("button", { name: "ETH (native)" }))
      if (differentRecipient) setRecipient(mocks.recipient)
      inputAmount()
      fireEvent.click(screen.getByRole("button", { name: "Redeem ETH" }))
      await waitFor(() =>
        expect(mocks.success).toHaveBeenCalledWith(
          "Neutron + proton redeemed for ETH",
        ),
      )
      expect(mocks.writeNative).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          functionName: "fusion",
          args: [1010101010101010102n, mocks.wallet],
        }),
      )
      expect(mocks.writeNative).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          functionName: "withdraw",
          args: [10n ** 18n],
        }),
      )
      if (differentRecipient) {
        expect(mocks.send).toHaveBeenCalledWith({
          to: mocks.recipient,
          value: 10n ** 18n,
        })
      } else {
        expect(mocks.send).not.toHaveBeenCalled()
      }
    },
  )

  it.each(["account", "network"])(
    "stops native fission when the %s changes between receipts",
    async (change) => {
      mocks.native = true
      let finishReceipt!: (value: { status: string }) => void
      mocks.waitReceipt.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishReceipt = resolve
          }),
      )
      const view = renderPage()
      fireEvent.click(screen.getByRole("button", { name: "ETH (native)" }))
      inputAmount()
      fireEvent.click(screen.getByRole("button", { name: "Split ETH" }))
      await waitFor(() => expect(mocks.waitReceipt).toHaveBeenCalledOnce())
      if (change === "account") mocks.address = mocks.recipient
      else mocks.chainId = 1
      view.rerender(<InteractionClient coinId={mocks.reactor} />)
      await act(async () => finishReceipt({ status: "success" }))
      expect(mocks.writeNative).toHaveBeenCalledOnce()
      expect(mocks.error).toHaveBeenCalledWith(
        "Wallet account or network changed during native fission. Check the original wallet before retrying.",
      )
      if (change === "network") {
        // The new verification gate unmounts transaction controls on this chain.
        expect(screen.getByRole("alert")).toHaveTextContent("No reactor factory configured")
      } else {
        expect(screen.getByRole("spinbutton")).toHaveValue(null)
      }
    },
  )

  it("preserves wrapped-asset recovery after unwrap rejection", async () => {
    mocks.native = true
    mocks.writeNative
      .mockResolvedValueOnce("0xfusion")
      .mockRejectedValueOnce(new Error("User rejected"))
    renderPage()
    chooseFrom("BUNDLE")
    fireEvent.click(screen.getByRole("button", { name: "ETH (native)" }))
    inputAmount()
    fireEvent.click(screen.getByRole("button", { name: "Redeem ETH" }))
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(
        "Fusion succeeded, but unwrap did not. The wrapped native asset remains in your wallet.",
      ),
    )
    expect(mocks.send).not.toHaveBeenCalled()
    expect(screen.getByRole("spinbutton")).toHaveValue(null)
  })

  it("clears submitted native input when receipt confirmation is uncertain", async () => {
    mocks.native = true
    mocks.waitReceipt.mockRejectedValueOnce(new Error("RPC unavailable"))
    renderPage()
    chooseFrom("BUNDLE")
    fireEvent.click(screen.getByRole("button", { name: "ETH (native)" }))
    inputAmount()
    fireEvent.click(screen.getByRole("button", { name: "Redeem ETH" }))
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith(
        "Fusion was submitted but its final status could not be confirmed. Check your wallet or explorer before retrying.",
      ),
    )
    expect(mocks.writeNative).toHaveBeenCalledOnce()
    expect(screen.getByRole("spinbutton")).toHaveValue(null)
  })
})
