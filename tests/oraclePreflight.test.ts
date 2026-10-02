import { describe, expect, it, vi } from "vitest"
import type { PublicClient } from "viem"
import { runOraclePreflight } from "@/utils/oraclePreflight"

const address = "0x0000000000000000000000000000000000000001"
const chainId = 11155111

function createClient(
  overrides: Partial<{
    getChainId: () => Promise<number>
    getBlock: () => Promise<{ number: bigint; timestamp: bigint }>
    getBytecode: () => Promise<`0x${string}` | undefined>
    getBlockNumber: () => Promise<bigint>
    readContract: (args: { functionName: string }) => Promise<unknown>
  }> = {},
): PublicClient {
  const values: Record<string, unknown> = {
    readValue: 1_000_000_000_000_000_000n,
    readValueInterval: [
      900_000_000_000_000_000n,
      1_100_000_000_000_000_000n,
    ] as const,
    lastUpdated: 940n,
    description: "Test Oracle",
  }

  return {
    getChainId: vi.fn().mockResolvedValue(chainId),
    getBlock: vi.fn().mockResolvedValue({
      number: 123n,
      timestamp: 1_000n,
    }),
    getBytecode: vi.fn().mockResolvedValue("0x1234"),
    getBlockNumber: vi.fn().mockResolvedValue(123n),
    readContract: vi.fn().mockImplementation(
      ({ functionName }: { functionName: string }) =>
        Promise.resolve(values[functionName]),
    ),
    ...overrides,
  } as unknown as PublicClient
}

describe("runOraclePreflight", () => {
  it("blocks invalid EVM addresses before making RPC calls", async () => {
    const client = createClient()

    const result = await runOraclePreflight(
      client,
      "not-an-address",
      chainId,
    )

    expect(result.status).toBe("blocked")
    expect(result.issues).toContain(
      "Oracle address is not a valid EVM address.",
    )
    expect(client.getChainId).not.toHaveBeenCalled()
  })

  it("throws when the RPC chain does not match the requested chain", async () => {
    const client = createClient({
      getChainId: vi.fn().mockResolvedValue(1),
    })

    await expect(
      runOraclePreflight(client, address, chainId),
    ).rejects.toThrow(
      `Oracle preflight RPC chain mismatch: expected ${chainId}, received 1.`,
    )
  })

  it("blocks an address with no deployed contract", async () => {
    const client = createClient({
      getBytecode: vi.fn().mockResolvedValue("0x"),
    })

    const result = await runOraclePreflight(client, address, chainId)

    expect(result.status).toBe("blocked")
    expect(result.issues).toContain(
      "No contract is deployed at this address on the current network.",
    )
  })

  it("accepts a compatible oracle and calculates its age", async () => {
    const client = createClient()

    const result = await runOraclePreflight(client, address, chainId)

    expect(result.status).toBe("compatible")
    expect(result.value).toBe(1_000_000_000_000_000_000n)
    expect(result.minValue).toBe(900_000_000_000_000_000n)
    expect(result.maxValue).toBe(1_100_000_000_000_000_000n)
    expect(result.description).toBe("Test Oracle")
    expect(result.ageSeconds).toBe(60n)
    expect(result.issues).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it("returns a warning when the oracle description is empty", async () => {
    const client = createClient({
      readContract: vi.fn().mockImplementation(
        ({ functionName }: { functionName: string }) => {
          if (functionName === "readValue") {
            return Promise.resolve(1_000_000_000_000_000_000n)
          }

          if (functionName === "readValueInterval") {
            return Promise.resolve([
              900_000_000_000_000_000n,
              1_100_000_000_000_000_000n,
            ] as const)
          }

          if (functionName === "lastUpdated") {
            return Promise.resolve(940n)
          }

          return Promise.resolve("   ")
        },
      ),
    })

    const result = await runOraclePreflight(client, address, chainId)

    expect(result.status).toBe("warning")
    expect(result.issues).toEqual([])
    expect(result.warnings).toEqual([
      "The oracle returned an empty description.",
    ])
  })

  it("blocks inconsistent oracle values", async () => {
    const client = createClient({
      readContract: vi.fn().mockImplementation(
        ({ functionName }: { functionName: string }) => {
          if (functionName === "readValue") {
            return Promise.resolve(0n)
          }

          if (functionName === "readValueInterval") {
            return Promise.resolve([2n, 1n] as const)
          }

          if (functionName === "lastUpdated") {
            return Promise.resolve(1_100n)
          }

          return Promise.resolve("Invalid Oracle")
        },
      ),
    })

    const result = await runOraclePreflight(client, address, chainId)

    expect(result.status).toBe("blocked")
    expect(result.issues).toContain("readValue() returned zero.")
    expect(result.issues).toContain(
      "readValueInterval() returned a minimum above the maximum.",
    )
    expect(result.issues).toContain(
      "The current oracle value falls outside its reported interval.",
    )
    expect(result.issues).toContain(
      "lastUpdated() returned a timestamp ahead of the latest block.",
    )
  })

  it("classifies an incompatible contract when all interface reads fail", async () => {
    const getBlockNumber = vi.fn().mockResolvedValue(123n)

    const client = createClient({
      readContract: vi.fn().mockRejectedValue(
        new Error("function unavailable"),
      ),
      getBlockNumber,
    })

    const result = await runOraclePreflight(client, address, chainId)

    expect(result.status).toBe("blocked")
    expect(result.issues).toHaveLength(4)
    expect(result.issues).toEqual(
      expect.arrayContaining([
        "readValue() could not be read.",
        "readValueInterval() could not be read.",
        "lastUpdated() could not be read.",
        "description() could not be read.",
      ]),
    )
    expect(getBlockNumber).toHaveBeenCalledOnce()
  })
})
