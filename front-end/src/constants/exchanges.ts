export const EXCHANGES = ["HOSE", "HNX", "UPCOM"] as const;
export const EXCHANGE_LIST: string[] = Array.from(EXCHANGES as readonly string[]);
export type ExchangeConst = typeof EXCHANGES[number];

export const HIGHLIGHT_TIMEOUT = 1000;