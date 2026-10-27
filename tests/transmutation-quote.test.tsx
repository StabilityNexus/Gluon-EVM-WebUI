import type { ReactNode } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createConfig, WagmiProvider } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { custom, decodeFunctionData, encodeFunctionResult } from "viem"
import { StableCoinReactorABI } from "@/utils/abi/StableCoin"
import { grossFusionAmountForNet } from "@/utils/nativeAsset"
import { useInteractionQuote } from "@/app/[coinId]/hooks/useInteractionQuote"

const WAD = 10n ** 18n
const reactor = "0x1111111111111111111111111111111111111111"
const wallet = "0x2222222222222222222222222222222222222222"
const recipient = "0x3333333333333333333333333333333333333333"
type Input = Parameters<typeof useInteractionQuote>[0]
type Call = { from: string; to: string; data: `0x${string}` }
const clients: QueryClient[] = []

function input(route: "PROTON_TO_NEUTRON" | "NEUTRON_TO_PROTON" = "NEUTRON_TO_PROTON"): Input {
  return {
    reactorAddress: reactor, address: wallet, chainId: sepolia.id, recipient,
    route, fromToken: route === "PROTON_TO_NEUTRON" ? "PROTON" : "NEUTRON",
    toToken: route === "PROTON_TO_NEUTRON" ? "NEUTRON" : "PROTON",
    amount: "1", setAmount: vi.fn(), useNativeBase: false,
    baseToken: reactor, neutronToken: wallet, protonToken: recipient,
    baseDecimalsNumber: 18, neutronDecimalsNumber: 18, protonDecimalsNumber: 18,
    nativeAsset: undefined, nativeBalance: undefined, fissionFee: 0n, fusionFee: 0n, devFee: 0n,
    reserve: 200n * WAD, neutronTotalSupply: 100n * WAD, protonTotalSupply: 100n * WAD,
    baseBalance: 0n, neutronBalance: 60n * WAD, protonBalance: 30n * WAD,
    baseAmountRaw: WAD, fusionGrossBaseRaw: null, reserveWad: 200n * WAD,
    neutronSupplyWad: 100n * WAD, protonSupplyWad: 100n * WAD,
    basePriceWad: WAD, basePricePegged: WAD, baseSymbolText: "B", activeBaseSymbol: "B",
    peggedSymbolText: "USD", neutronSymbolText: "N", protonSymbolText: "P",
  }
}

function encodedResult(call: Call, output: bigint, fee = WAD / 10n) {
  const decoded = decodeFunctionData({ abi: StableCoinReactorABI, data: call.data })
  if (decoded.functionName !== "transmuteProtonToNeutron" && decoded.functionName !== "transmuteNeutronToProton") {
    throw new Error("Unexpected simulated function")
  }
  return encodeFunctionResult({
    abi: StableCoinReactorABI, functionName: decoded.functionName, result: [output, fee],
  })
}

function setup(initial: Input, respond: (call: Call) => string | Promise<string> = (call) => encodedResult(call, 9n * WAD / 10n)) {
  const request = vi.fn(async ({ method, params }: { method: string; params?: unknown[] }) => {
    if (method === "eth_chainId") return "0xaa36a7"
    if (method === "eth_call") return respond(params![0] as Call)
    throw new Error(`Unexpected RPC method ${method}`)
  })
  const config = createConfig({
    chains: [sepolia, mainnet], connectors: [], ssr: true,
    transports: { [sepolia.id]: custom({ request }, { retryCount: 0 }), [mainnet.id]: custom({ request }, { retryCount: 0 }) },
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  clients.push(client)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
  const props = initial.route === "FUSION"
    ? {
        ...initial,
        fusionGrossBaseRaw: grossFusionAmountForNet(
          initial.baseAmountRaw!, initial.fusionFee!, initial.devFee!,
        ),
      }
    : initial
  const view = renderHook((props: Input) => useInteractionQuote(props), { initialProps: props, wrapper })
  return { ...view, request, client }
}

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
})

describe("contract-simulated transmutation quotes", () => {
  it.each(["FISSION", "FUSION"] as const)(
    "%s retains the rounded fee remainder",
    (route) => {
      const props = input()
      Object.assign(props, {
        route,
        fromToken: route === "FISSION" ? "BASE" : "BUNDLE",
        toToken: route === "FISSION" ? "BUNDLE" : "BASE",
        baseDecimalsNumber: 0,
        baseAmountRaw: 1n,
        reserve: 200n,
        fissionFee: WAD / 1000n,
        fusionFee: WAD / 1000n,
        devFee: WAD / 1000n,
      })
      const view = setup(props)
      const rows = view.result.current.breakdownPopover!.rows
      expect(
        rows.find((row) => row.label === "Fee retained")?.value,
      ).toBe("1 B")
      expect(
        rows.find((row) => row.label === "Dev fee")?.value,
      ).toBe("0 B")
      expect(
        rows.find(
          (row) => row.label === (
            route === "FISSION" ? "Net reserve" : "Net received"
          ),
        )?.value,
      ).toBe(route === "FUSION" ? "1 B" : "0 B")
    },
  )

  it("rounds both fusion burns up in raw units before formatting", () => {
    const props = input()
    Object.assign(props, {
      route: "FUSION",
      fromToken: "BUNDLE",
      toToken: "BASE",
      baseAmountRaw: 1n,
      reserve: 3n,
      neutronTotalSupply: 1000000n,
      protonTotalSupply: 1n,
      baseDecimalsNumber: 6,
      neutronDecimalsNumber: 6,
      protonDecimalsNumber: 6,
      reserveWad: 3n * 10n ** 12n,
      neutronSupplyWad: WAD,
      protonSupplyWad: 10n ** 12n,
    })
    const view = setup(props)
    const rows = view.result.current.breakdownPopover!.rows
    expect(
      rows.find((row) => row.label === "Burn N")?.value,
    ).toBe("0.333334 N")
    expect(
      rows.find((row) => row.label === "Burn P")?.value,
    ).toBe("0.000001 P")
  })

  it("deducts both fees in the fission breakdown", () => {
    const props = input()
    Object.assign(props, { route: "FISSION", fromToken: "BASE", toToken: "BUNDLE", fissionFee: WAD / 50n, devFee: WAD / 1000n })
    const view = setup(props)
    const rows = view.result.current.breakdownPopover!.rows
    expect(rows.find((row) => row.label === "Fee retained")?.value).toBe("0.02 B")
    expect(rows.find((row) => row.label === "Dev fee")?.value).toBe("0.001 B")
    expect(rows.find((row) => row.label === "Net reserve")?.value).toBe("0.979 B")
  })

  it("deducts both fees in the fusion output", () => {
    const props = input()
    Object.assign(props, { route: "FUSION", fromToken: "BUNDLE", toToken: "BASE", fusionFee: WAD / 50n, devFee: WAD / 1000n })
    const view = setup(props)
    expect(view.result.current.toInputValue).toBe("1")
    expect(view.result.current.breakdownPopover!.rows.find((row) => row.label === "Net received")?.value).toBe("1 B")
    expect(view.result.current.breakdownPopover!.rows.find((row) => row.label === "Dev fee")?.value).toBe("0.001021 B")
  })
  it.each([
    ["PROTON_TO_NEUTRON", "transmuteProtonToNeutron", "0.9 N"],
    ["NEUTRON_TO_PROTON", "transmuteNeutronToProton", "0.9 P"],
  ] as const)("%s shows net output and simulates the input with no minimum", async (route, functionName, expected) => {
    const view = setup(input(route))
    await waitFor(() => expect(view.result.current.toInputValue).toBe(expected))
    expect(view.result.current.transmutationOutput).toBe(9n * WAD / 10n)
    expect(view.result.current.minimumOutputText).toContain("Minimum received: 0.9")
    const call = view.request.mock.calls.find(([request]) => request.method === "eth_call")![0]
    const tx = call.params![0] as Call
    expect(tx.from.toLowerCase()).toBe(wallet)
    expect(tx.to.toLowerCase()).toBe(reactor)
    expect(decodeFunctionData({ abi: StableCoinReactorABI, data: tx.data })).toEqual({
      functionName, args: [WAD, 0n, recipient],
    })
  })

  it.each([
    ["NEUTRON_TO_PROTON", 20485501923821n, "0.000020485501923821 P"],
    ["PROTON_TO_NEUTRON", 20485501923821n, "0.000020485501923821 N"],
    ["NEUTRON_TO_PROTON", 1n, "0.000000000000000001 P"],
    ["PROTON_TO_NEUTRON", 1n, "0.000000000000000001 N"],
  ] as const)(
    "%s displays a small positive quote without truncating it to zero: %s",
    async (route, output, expected) => {
      const view = setup(input(route), (call) => encodedResult(call, output))
      await waitFor(() =>
        expect(view.result.current.toInputValue).toBe(expected),
      )
      expect(view.result.current.transmutationOutput).toBe(output)
      expect(view.result.current.minimumOutputText).toContain(
        `Minimum received: ${expected}.`,
      )
    },
  )

  it("supports a zero-fee reactor without a separate local pricing formula", async () => {
    const view = setup(input(), (call) => encodedResult(call, WAD, 0n))
    await waitFor(() => expect(view.result.current.toInputValue).toBe("1 P"))
  })

  it("respects different input/output decimals, including zero decimals", async () => {
    const props = { ...input("PROTON_TO_NEUTRON"), amount: "1.25", protonDecimalsNumber: 6, neutronDecimalsNumber: 0 }
    const view = setup(props, (call) => encodedResult(call, 9n))
    await waitFor(() => expect(view.result.current.toInputValue).toBe("9 N"))
    const call = view.request.mock.calls.find(([request]) => request.method === "eth_call")![0]
    expect(decodeFunctionData({ abi: StableCoinReactorABI, data: (call.params![0] as Call).data }).args).toEqual([1250000n, 0n, recipient])
  })

  it.each([
    ["disconnected wallet", { address: undefined }],
    ["invalid recipient", { recipient: "0x" }],
    ["invalid reactor", { reactorAddress: "0x" }],
    ["zero input", { amount: "0" }],
    ["negative input", { amount: "-1" }],
    ["unknown decimals", { neutronDecimalsNumber: undefined }],
    ["another route", { route: "FISSION" }],
  ] as const)("does not simulate with %s", async (_name, change) => {
    const view = setup({ ...input(), ...change })
    await act(async () => {})
    expect(view.request.mock.calls.filter(([request]) => request.method === "eth_call")).toHaveLength(0)
    if (_name !== "another route") expect(view.result.current.toInputValue).toBe("")
  })

  it.each(["execution reverted", "RPC unavailable"])("clears a prior quote on %s instead of falling back to gross output", async (message) => {
    let failing = false
    const view = setup(input(), (call) => {
      if (failing) throw new Error(message)
      return encodedResult(call, 9n * WAD / 10n)
    })
    await waitFor(() => expect(view.result.current.toInputValue).toBe("0.9 P"))
    failing = true
    await act(async () => { await view.client.refetchQueries({ queryKey: ["simulateContract"] }) })
    await waitFor(() => expect(view.result.current.toInputValue).toBe(""))
  })

  it("does not show a mint estimate when the contract returns zero", async () => {
    const view = setup(input(), (call) => encodedResult(call, 0n, 0n))
    await waitFor(() => expect(view.request).toHaveBeenCalled())
    expect(view.result.current.toInputValue).toBe("")
  })

  it("ignores a late response for an amount the user has already changed", async () => {
    let finishOldRequest: (() => void) | undefined
    const view = setup(input(), async (call) => {
      const { args } = decodeFunctionData({ abi: StableCoinReactorABI, data: call.data })
      if (args?.[0] === WAD) {
        await new Promise<void>((resolve) => { finishOldRequest = resolve })
        return encodedResult(call, 9n * WAD / 10n)
      }
      return encodedResult(call, 18n * WAD / 10n)
    })
    await waitFor(() => expect(finishOldRequest).toBeDefined())
    view.rerender({ ...input(), amount: "2" })
    await waitFor(() => expect(view.result.current.toInputValue).toBe("1.8 P"))
    await act(async () => { finishOldRequest!() })
    expect(view.result.current.toInputValue).toBe("1.8 P")
  })

  it.each([
    { amount: "2" },
    { address: recipient },
    { recipient: wallet },
    { reactorAddress: recipient },
    { chainId: mainnet.id },
    { route: "PROTON_TO_NEUTRON" as const, fromToken: "PROTON" as const, toToken: "NEUTRON" as const },
  ] as const)("drops the old quote while simulating changed transaction context %j", async (change) => {
    let complete: (() => void) | undefined
    let calls = 0
    const view = setup(input(), async (call) => {
      calls += 1
      if (calls > 1) await new Promise<void>((resolve) => { complete = resolve })
      return encodedResult(call, calls === 1 ? 9n * WAD / 10n : 8n * WAD / 10n)
    })
    await waitFor(() => expect(view.result.current.toInputValue).toBe("0.9 P"))
    view.rerender({ ...input(), ...change })
    expect(view.result.current.toInputValue).toBe("")
    expect(view.result.current.transmutationOutput).toBeUndefined()
    expect(view.result.current.minimumOutputText).toBe("")
    await waitFor(() => expect(complete).toBeDefined())
    await act(async () => { complete!() })
    await waitFor(() => expect(view.result.current.toInputValue).toBe(change.route ? "0.8 N" : "0.8 P"))
  })
})
