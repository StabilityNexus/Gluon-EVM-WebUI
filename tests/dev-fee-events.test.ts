import { describe, expect, it } from "vitest"
import { concat, decodeEventLog, keccak256, pad, stringToHex, toHex } from "viem"
import { StableCoinReactorABI } from "@/utils/abi/StableCoin"

const from = "0x1111111111111111111111111111111111111111"
const to = "0x2222222222222222222222222222222222222222"

describe("operation dev fee events", () => {
  it.each([
    ["Fission", "Fission(address,address,uint256,uint256,uint256,uint256,uint256)", [11n, 12n, 13n, 14n, 15n]],
    ["Fusion", "Fusion(address,address,uint256,uint256,uint256,uint256,uint256)", [11n, 12n, 13n, 14n, 15n]],
    ["TransmutePlus", "TransmutePlus(address,address,uint256,uint256,uint256,uint256,uint256,uint256)", [11n, 12n, 13n, 14n, 15n, 16n]],
    ["TransmuteMinus", "TransmuteMinus(address,address,uint256,uint256,uint256,uint256,uint256,uint256)", [11n, 12n, 13n, 14n, 15n, 16n]],
  ] as const)("decodes the dev payment from %s", (eventName, signature, amounts) => {
    const decoded = decodeEventLog({
      abi: StableCoinReactorABI,
      topics: [keccak256(stringToHex(signature)), pad(from), pad(to)],
      data: concat(amounts.map((value) => toHex(value, { size: 32 }))),
    })
    expect(decoded.eventName).toBe(eventName)
    expect(decoded.args).toMatchObject({ from, to, devFeeAmount: amounts.at(-1) })
  })

  it("does not expose the removed standalone payment event", () => {
    expect(StableCoinReactorABI.some((entry) => entry.type === "event" && String(entry.name) === "DevFeePaid")).toBe(false)
  })
})
