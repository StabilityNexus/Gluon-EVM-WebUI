import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { maxUint256 } from "viem"
import { useReactorContracts } from "@/app/[coinId]/hooks/useReactorContracts"
import { useReactorPricing } from "@/app/[coinId]/hooks/useReactorPricing"

const mocks = vi.hoisted(() => ({
  values: {} as Record<string, unknown>,
  refetch: vi.fn(),
  setNative: vi.fn(),
}))

vi.mock("wagmi", () => ({
  useBalance: () => ({ data: undefined, refetch: mocks.refetch }),
  useReadContract: ({ functionName }: { functionName: string }) => ({
    data: mocks.values[functionName],
    refetch: mocks.refetch,
  }),
}))

vi.mock("@/utils/networks", () => ({ getGluonNetwork: () => undefined }))

const WAD = 10n ** 18n
const reactor = "0x1111111111111111111111111111111111111111"

function renderPricing() {
  return renderHook(() => {
    const contracts = useReactorContracts({
      reactorAddress: reactor,
      address: undefined,
      chainId: 11155111,
      route: "FISSION",
      setUseNativeBase: mocks.setNative,
    })
    return useReactorPricing({
      ...contracts,
      amount: "1",
      useNativeBase: false,
      route: "FISSION",
    })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.values = {
    BASE_TOKEN: "0x2222222222222222222222222222222222222222",
    NEUTRON_TOKEN: "0x3333333333333333333333333333333333333333",
    PROTON_TOKEN: "0x4444444444444444444444444444444444444444",
    decimals: 18,
    reserve: 300n * WAD,
    totalSupply: 100n * WAD,
    CRITICAL_RESERVE_RATIO: 15n * WAD / 10n,
    getBasePriceInPeggedAsset: WAD,
    reserveRatioPeggedAsset: 1995009323347836691n,
    neutronPriceInBase: 751876185462051535n,
    protonPriceInBase: 1496247629075896930n,
  }
})

describe("reactor pricing source of truth", () => {
  it("uses the contract ratio and tranche prices when local accounting disagrees", () => {
    const { result } = renderPricing()
    // The old reserve * price / supply model would show 300% and a Neutron price of 1.
    expect(result.current.reserveRatioText).toBe("199.5%")
    expect(result.current.neutronPriceInBase).toBe(751876185462051535n)
    expect(result.current.protonPriceInBase).toBe(1496247629075896930n)
  })

  it("does not substitute local estimates while contract pricing is unavailable", () => {
    mocks.values.reserveRatioPeggedAsset = undefined
    mocks.values.neutronPriceInBase = undefined
    mocks.values.protonPriceInBase = undefined
    const { result, rerender } = renderPricing()
    expect(result.current.reserveRatioText).toBe("—")
    expect(result.current.neutronPriceInBase).toBeUndefined()
    expect(result.current.protonPriceInBase).toBeUndefined()
    mocks.values.reserveRatioPeggedAsset = 18n * WAD / 10n
    mocks.values.neutronPriceInBase = 9n * WAD / 10n
    mocks.values.protonPriceInBase = 11n * WAD / 10n
    rerender()
    expect(result.current.reserveRatioText).toBe("180.0%")
    expect(result.current.neutronPriceInBase).toBe(9n * WAD / 10n)
  })

  it("preserves a zero oracle price and ratio without replacing the contract's tranche prices", () => {
    mocks.values.getBasePriceInPeggedAsset = 0n
    mocks.values.reserveRatioPeggedAsset = 0n
    mocks.values.neutronPriceInBase = 3n * WAD
    mocks.values.protonPriceInBase = 0n
    const { result } = renderPricing()
    expect(result.current.reserveRatioText).toBe("0.0%")
    expect(result.current.basePriceWad).toBe(0n)
    expect(result.current.neutronPriceInBase).toBe(3n * WAD)
    expect(result.current.protonPriceInBase).toBe(0n)
    expect(result.current.neutronPricePegged).toBe(0n)
    expect(result.current.protonPricePegged).toBe(0n)
  })

  it("renders the contract's infinite-ratio sentinel without calling it bootstrap", () => {
    mocks.values.reserveRatioPeggedAsset = maxUint256
    const { result, rerender } = renderPricing()
    expect(result.current.reserveRatioText).toBe("∞")
    mocks.values.totalSupply = 0n
    rerender()
    expect(result.current.reserveRatioText).toBe("∞ (bootstrap)")
  })

  it("keeps contract WAD prices independent of reserve-token decimal scaling", () => {
    mocks.values.decimals = 6
    mocks.values.reserve = 300000000n
    const { result } = renderPricing()
    expect(result.current.baseAmountRaw).toBe(1000000n)
    expect(result.current.reserveWad).toBe(300n * WAD)
    expect(result.current.reserveRatioText).toBe("199.5%")
    expect(result.current.neutronPriceInBase).toBe(751876185462051535n)
  })
})
