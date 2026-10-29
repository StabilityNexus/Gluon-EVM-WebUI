import { fallback, http } from "viem"

export const MAINNET_RPC_PRIMARY =
  "https://ethereum-rpc.publicnode.com"

export const MAINNET_RPC_BACKUP =
  "https://eth.drpc.org"

export function createMainnetTransport() {
  return fallback(
    [
      http(MAINNET_RPC_PRIMARY, {
        retryCount: 0,
        timeout: 12000,
      }),
      http(MAINNET_RPC_BACKUP, {
        retryCount: 0,
        timeout: 12000,
      }),
    ],
    { retryCount: 0 }
  )
}
