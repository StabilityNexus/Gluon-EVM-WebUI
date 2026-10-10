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
  fee: 10n ** 16n,
  approving: false,
  receiptSuccess: false,
  refetch: vi.fn(),
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
  useAccount: () => ({ address: mocks.connected ? mocks.address : undefined }),
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
      vaultName: "Test",
      ORACLE: mocks.recipient,
      BASE_TOKEN: mocks.base,
      NEUTRON_TOKEN: mocks.neutron,
      PROTON_TOKEN: mocks.proton,
      TREASURY: mocks.recipient,
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
      totalSupply: 100n * wad,
      reserve: 300n * wad,
      balanceOf: parseUnits("12.123456789", mocks.decimals),
      allowance: mocks.allowance,
      FISSION_FEE: mocks.fee,
      FUSION_FEE: mocks.fee,
      CRITICAL_RESERVE_RATIO: 2n * wad,
      getBasePriceInPeggedAsset: wad,
    }
    return { data: data[functionName], refetch: mocks.refetch }
  },
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
  getGluonNetwork: () => ({
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

vi.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (props: unknown) => ReactNode }) =>
      children({
        account: mocks.connected ? {} : undefined,
        chain: mocks.connected ? {} : undefined,
        mounted: true,
        openConnectModal: mocks.openConnect,
      }),
  },
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
  mocks.fee = 10n ** 16n
  mocks.approving = false
  mocks.receiptSuccess = false
  mocks.write.mockReset()
  mocks.writeNative.mockReset().mockResolvedValue("0xabc")
  mocks.send.mockReset().mockResolvedValue("0xdef")
  mocks.waitReceipt.mockReset().mockResolvedValue({ status: "success" })
  mocks.read.mockReset().mockResolvedValue(0n)
})

describe("reactor interaction", () => {
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

  it("reverses the pair and preserves gross ERC20 fusion input semantics", () => {
    renderPage()
    fireEvent.click(
      screen.getByRole("button", { name: "Reverse conversion direction" }),
    )
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("BUNDLE")
    expect(screen.getAllByRole("combobox")[1]).toHaveValue("BASE")
    inputAmount()
    fireEvent.click(screen.getByRole("button", { name: "Merge Tokens" }))
    expect(mocks.write).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "fusion",
        args: [10n ** 18n, mocks.wallet],
      }),
    )
  })

  it.each([
    ["PROTON", "NEUTRON", "Transmute β⁺", "transmuteProtonToNeutron"],
    ["NEUTRON", "PROTON", "Transmute β⁻", "transmuteNeutronToProton"],
  ])(
    "runs %s transmutation with the paired target",
    (from, to, label, functionName) => {
      renderPage()
      chooseFrom(from)
      expect(screen.getAllByRole("combobox")[1]).toHaveValue(to)
      inputAmount("2")
      fireEvent.click(screen.getByRole("button", { name: label }))
      expect(mocks.write).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName,
          args: [2n * 10n ** 18n, mocks.wallet],
        }),
      )
    },
  )

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
          args: [1010101010101010101n, mocks.wallet],
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
      expect(screen.getByRole("spinbutton")).toHaveValue(null)
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
