export type WalletEvent =
  | "connect_start"
  | "connect_success"
  | "connect_error"
  | "disconnect"
  | "switch_start"
  | "switch_success"
  | "switch_error"
  | "chain_changed"
  | "dropdown_open"
  | "dropdown_close"
  | "connect_modal_open"
  | "connect_modal_close"
  | "chain_target_select";

export type WalletLogEntry = {
  id: number;
  timestamp: number;
  event: WalletEvent;
  payload: Record<string, unknown>;
};

const MAX_WALLET_LOGS = 100;
let logCounter = 0;
let walletLogs: WalletLogEntry[] = [];
const walletLogSubscribers = new Set<(entries: WalletLogEntry[]) => void>();

function emitWalletLogUpdate() {
  const snapshot = [...walletLogs];
  for (const subscriber of walletLogSubscribers) {
    subscriber(snapshot);
  }
}

export function logWalletEvent(
  event: WalletEvent,
  payload?: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "production") return;
  const entry: WalletLogEntry = {
    id: ++logCounter,
    timestamp: Date.now(),
    event,
    payload: payload ?? {},
  };
  walletLogs = [entry, ...walletLogs].slice(0, MAX_WALLET_LOGS);
  emitWalletLogUpdate();
  console.info(`[WALLET][${event}]`, payload ?? {});
}

export function getWalletLogs() {
  return walletLogs;
}

export function subscribeWalletLogs(
  subscriber: (entries: WalletLogEntry[]) => void,
) {
  walletLogSubscribers.add(subscriber);
  subscriber([...walletLogs]);
  return () => {
    walletLogSubscribers.delete(subscriber);
  };
}
