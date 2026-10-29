import { afterEach, describe, expect, it, vi } from "vitest"
import { config } from "@/utils/config"
import { MAINNET_CHAIN_ID } from "@/utils/networks"
import {
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

    const client = config.getClient({
      chainId: MAINNET_CHAIN_ID,
    })

    expect(await client.request({ method: "eth_chainId" })).toBe("0x1")
    expect(requested).toEqual([
      MAINNET_RPC_PRIMARY,
      MAINNET_RPC_BACKUP,
    ])
  })
})
