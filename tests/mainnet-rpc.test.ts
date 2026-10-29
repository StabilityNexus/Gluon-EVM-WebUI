import { afterEach, describe, expect, it, vi } from "vitest"
import { createPublicClient } from "viem"
import { mainnet } from "viem/chains"
import {
  createMainnetTransport,
  MAINNET_RPC_PRIMARY,
  MAINNET_RPC_BACKUP,
} from "@/utils/mainnetTransport"

describe("Mainnet RPC transport", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("falls back when the primary returns HTTP 429", async () => {
    const requested: string[] = []

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url

        requested.push(url)

        if (url === MAINNET_RPC_PRIMARY) {
          return new Response("Rate limited", {
            status: 429,
          })
        }

        if (url === MAINNET_RPC_BACKUP) {
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              result: "0x1",
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
        }

        throw new Error("Unexpected RPC endpoint: " + url)
      })
    )

    const client = createPublicClient({
      chain: mainnet,
      transport: createMainnetTransport(),
    })

    expect(await client.getChainId()).toBe(1)
    expect(requested).toEqual([
      MAINNET_RPC_PRIMARY,
      MAINNET_RPC_BACKUP,
    ])
  })
})
