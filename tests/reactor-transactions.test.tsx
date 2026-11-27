import type { ReactNode } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createConfig, WagmiProvider } from "wagmi"
import { connect } from "wagmi/actions"
import { injected } from "wagmi/connectors"
import { sepolia } from "wagmi/chains"
import { ContractFunctionRevertedError, custom, encodeErrorResult, type Hex } from "viem"
import { toast } from "sonner"
import { StableCoinReactorABI } from "@/utils/abi/StableCoin"
import { useReactorTransactions } from "@/app/[coinId]/hooks/useReactorTransactions"
import { describeTransactionError } from "@/app/[coinId]/interactionUtils"

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

const WAD = 10n ** 18n
const reactor = "0x1111111111111111111111111111111111111111"
const wallet = "0x2222222222222222222222222222222222222222"
const baseToken = "0x4444444444444444444444444444444444444444"
const txHash = `0x${"ab".repeat(32)}` as const
type Input = Parameters<typeof useReactorTransactions>[0]
type Mode = "reject" | "noFunds" | "revert" | "revertNoReason" | "rpcDown" | "success"
const clients: QueryClient[] = []

const reactorError = (errorName: "ExcessiveSlippage" | "ReserveRatioOutOfRange") =>
  errorName === "ExcessiveSlippage"
    ? encodeErrorResult({ abi: StableCoinReactorABI, errorName })
    : encodeErrorResult({ abi: StableCoinReactorABI, errorName, args: [WAD] })

// A stub EIP-1193 wallet. The real wagmi and viem stack runs on top of it.
function makeProvider(mode: Mode, revertData?: Hex) {
  const calls: string[] = []
  const request = vi.fn(async ({ method }: { method: string }) => {
    calls.push(method)
    switch (method) {
      case "eth_chainId":
        return "0xaa36a7"
      case "eth_accounts":
      case "eth_requestAccounts":
        return [wallet]
      case "wallet_requestPermissions":
        return [{ parentCapability: "eth_accounts" }]
      case "eth_sendTransaction":
        if (mode === "reject") {
          throw Object.assign(new Error("User denied transaction signature."), { code: 4001 })
        }
        if (mode === "noFunds") {
          throw Object.assign(
            new Error("insufficient funds for gas * price + value: balance 0"),
            { code: -32603 },
          )
        }
        return txHash
      case "eth_blockNumber":
        return "0x10"
      case "eth_getTransactionReceipt":
        if (mode === "rpcDown") {
          throw Object.assign(new Error("Too many requests"), { code: -32005 })
        }
        return {
          transactionHash: txHash, blockHash: `0x${"cd".repeat(32)}`, blockNumber: "0x10",
          transactionIndex: "0x0", from: wallet, to: reactor, cumulativeGasUsed: "0x5208",
          gasUsed: "0x5208", effectiveGasPrice: "0x1", contractAddress: null, logs: [],
          logsBloom: `0x${"00".repeat(256)}`, status: mode === "success" ? "0x1" : "0x0", type: "0x2",
        }
      case "eth_getTransactionByHash":
        return {
          hash: txHash, blockHash: `0x${"cd".repeat(32)}`, blockNumber: "0x10",
          transactionIndex: "0x0", from: wallet, to: reactor, input: "0x", value: "0x0",
          gas: "0x5208", maxFeePerGas: "0x1", maxPriorityFeePerGas: "0x1", nonce: "0x0",
          type: "0x2", chainId: "0xaa36a7", v: "0x0", r: "0x1", s: "0x1", accessList: [],
        }
      case "eth_call":
        // wagmi replays a reverted transaction to read its revert reason.
        if (mode === "revertNoReason") return "0x"
        throw Object.assign(new Error("execution reverted"), { code: 3, data: revertData })
      default:
        throw new Error(`Unexpected RPC method ${method}`)
    }
  })
  return { request, calls, on: vi.fn(), removeListener: vi.fn() }
}

function input(route: Input["route"]): Input {
  const refetch = () => vi.fn(async () => ({}) as never)
  return {
    transmutationOutput: route === "FISSION" || route === "FUSION" ? undefined : WAD,
    displayFusionBreakdown: route === "FUSION"
      ? { requestedBaseOut: WAD, grossBase: WAD, fee: 0n, devFeeAmount: 0n, netBase: WAD, neutronBurn: WAD, protonBurn: WAD }
      : null,
    neutronBalance: 10n * WAD, protonBalance: 10n * WAD,
    address: wallet, chainId: sepolia.id, amount: "1", setAmount: vi.fn(),
    useNativeBase: false, setUseNativeBase: vi.fn(), recipient: wallet, route,
    baseToken, refetchBaseToken: refetch(), baseDecimalsNumber: 18, nativeAsset: undefined,
    refetchNativeBalance: refetch(), refetchNeutronToken: refetch(), refetchProtonToken: refetch(),
    refetchFissionFee: refetch(), fusionFee: 0n, devFee: 0n, refetchFusionFee: refetch(),
    refetchReserve: refetch(), refetchBasePrice: refetch(), refetchReserveRatio: refetch(),
    refetchNeutronPrice: refetch(), refetchProtonPrice: refetch(),
    refetchNeutronTotalSupply: refetch(), refetchProtonTotalSupply: refetch(),
    refetchBaseBalance: refetch(), refetchNeutronBalance: refetch(), refetchProtonBalance: refetch(),
    baseAllowance: 0n, refetchBaseAllowance: refetch(),
    neutronDecimalsNumber: 18, protonDecimalsNumber: 18,
    fusionGrossBaseRaw: route === "FUSION" ? WAD : null,
    baseSymbolText: "USDC", reactorAddress: reactor,
  } as Input
}

async function setup(mode: Mode, route: Input["route"], revertData?: Hex) {
  const provider = makeProvider(mode, revertData)
  const config = createConfig({
    chains: [sepolia],
    connectors: [injected({ target: () => ({ id: "stub", name: "Stub", provider: provider as never }) })],
    transports: { [sepolia.id]: custom(provider, { retryCount: 0 }) },
    pollingInterval: 50,
  })
  await connect(config, { connector: config.connectors[0] })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clients.push(client)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
  const props = input(route)
  const view = renderHook(() => useReactorTransactions(props), { wrapper })
  return { view, provider, props, client }
}

const lastError = () => String(vi.mocked(toast.error).mock.calls.at(-1)?.[0])

beforeEach(() => {
  vi.mocked(toast.error).mockClear()
  vi.mocked(toast.success).mockClear()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
  vi.restoreAllMocks()
})

describe.each([
  ["FISSION", /^Fission failed/],
  ["FUSION", /^Fusion failed/],
  ["PROTON_TO_NEUTRON", /^Proton to neutron transmutation failed/],
  ["NEUTRON_TO_PROTON", /^Neutron to proton transmutation failed/],
] as const)("%s transaction feedback", (route, title) => {
  it("shows an error when the wallet rejects the transaction", async () => {
    const { view, provider, props } = await setup("reject", route)
    await act(async () => { await view.result.current.handleSwap() })

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(provider.calls).toContain("eth_sendTransaction")
    expect(lastError()).toMatch(title)
    expect(lastError()).toMatch(/rejected in your wallet/)
    expect(view.result.current.isProcessing).toBe(false)
    expect(props.setAmount).not.toHaveBeenCalled()
  })

  it("shows the decoded reason when the mined transaction reverts", async () => {
    const { view, provider, props } = await setup("revert", route, reactorError("ReserveRatioOutOfRange"))
    await act(async () => { await view.result.current.handleSwap() })

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(provider.calls).toContain("eth_getTransactionReceipt")
    expect(lastError()).toMatch(title)
    expect(lastError()).toMatch(/ReserveRatioOutOfRange/)
    expect(view.result.current.isProcessing).toBe(false)
    expect(toast.success).not.toHaveBeenCalled()
    expect(props.setAmount).not.toHaveBeenCalled()
  })
})

describe("approve transaction feedback", () => {
  it("shows an error when the wallet rejects the approval", async () => {
    const { view } = await setup("reject", "FISSION")
    expect(view.result.current.needsApproval).toBe(true)
    act(() => { view.result.current.handleApprove() })

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(lastError()).toMatch(/^Approval failed.*rejected in your wallet/)
    expect(view.result.current.isProcessing).toBe(false)
  })

  it("shows an error when the mined approval reverts", async () => {
    const { view, provider } = await setup("revert", "FISSION")
    act(() => { view.result.current.handleApprove() })

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(provider.calls).toContain("eth_getTransactionReceipt")
    expect(lastError()).toMatch(/^Approval failed/)
    expect(view.result.current.isProcessing).toBe(false)
  })
})

describe("readable failure reasons", () => {
  it("explains a slippage revert on a transmutation", async () => {
    const { view } = await setup("revert", "NEUTRON_TO_PROTON", reactorError("ExcessiveSlippage"))
    await act(async () => { await view.result.current.handleSwap() })

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(lastError()).toMatch(/price moved/i)
  })

  it("still reports a reverted receipt whose replay gives no reason", async () => {
    const { view } = await setup("revertNoReason", "PROTON_TO_NEUTRON")
    await act(async () => { await view.result.current.handleSwap() })

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(lastError()).toBe("Proton to neutron transmutation failed. The transaction did not succeed.")
  })

  it("explains a wallet without enough funds for gas", async () => {
    const { view } = await setup("noFunds", "FISSION")
    await act(async () => { await view.result.current.handleSwap() })

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(lastError()).toMatch(/not enough funds/i)
  })

  it("shows a plain revert message as written", () => {
    const error = new ContractFunctionRevertedError({
      abi: StableCoinReactorABI,
      functionName: "fission",
      data: encodeErrorResult({
        abi: [{ type: "error", name: "Error", inputs: [{ name: "message", type: "string" }] }],
        errorName: "Error",
        args: ["Reactor paused"],
      }),
    })
    expect(describeTransactionError(error)).toBe("Reactor paused")
  })
})

describe("repeated failures", () => {
  it("shows a second wallet rejection after a retry", async () => {
    const { view } = await setup("reject", "FISSION")
    await act(async () => { await view.result.current.handleSwap() })
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))

    await act(async () => { await view.result.current.handleSwap() })
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2))
  })

  it("does not repeat the error when a failed receipt is fetched again", async () => {
    const { view, provider, client } = await setup("revert", "FISSION", reactorError("ReserveRatioOutOfRange"))
    await act(async () => { await view.result.current.handleSwap() })
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))

    // React Query refetches failed queries when the window regains focus.
    await act(async () => { await client.refetchQueries({ type: "active" }) })
    await waitFor(() =>
      expect(provider.calls.filter((method) => method === "eth_call")).toHaveLength(2),
    )
    expect(toast.error).toHaveBeenCalledTimes(1)
  })
})

describe("unknown receipt status", () => {
  it("does not call the transaction failed when the receipt cannot be read", async () => {
    const { view, props } = await setup("rpcDown", "FUSION")
    await act(async () => { await view.result.current.handleSwap() })

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(lastError()).toBe(
      "Fusion was submitted but its final status could not be confirmed. Check your wallet or explorer before retrying.",
    )
    expect(view.result.current.isProcessing).toBe(false)
    expect(props.setAmount).not.toHaveBeenCalled()
  })
})

describe("successful transaction", () => {
  it("keeps the success toast and clears the amount after fission", async () => {
    const { view, props } = await setup("success", "FISSION")
    await act(async () => { await view.result.current.handleSwap() })

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Base converted into neutron + proton"))
    expect(props.setAmount).toHaveBeenCalledWith("")
    expect(toast.error).not.toHaveBeenCalled()
  })
})
