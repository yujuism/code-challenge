export const PRICES_URL = "https://interview.switcheo.com/prices.json";
const ICON_BASE_URL = "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens";

export interface Token {
  symbol: string;
  priceUsd: number;
  iconUrl: string;
}

export interface PriceList {
  tokens: Token[];
  /** Timestamp of the most recent price in the feed. */
  updatedAt: Date | null;
}

interface PriceEntry {
  currency: string;
  date: string;
  price: number;
}

function isPriceEntry(value: unknown): value is PriceEntry {
  if (typeof value !== "object" || value === null) return false;
  const { currency, date, price } = value as Record<string, unknown>;
  return (
    typeof currency === "string" &&
    currency.length > 0 &&
    typeof date === "string" &&
    typeof price === "number" &&
    Number.isFinite(price) &&
    price > 0
  );
}

/**
 * Turns the raw price feed into a clean token list.
 *
 * The feed is untrusted input: it contains duplicate currencies (e.g. BUSD twice with
 * different prices) and may contain malformed rows. Only the most recent price per
 * currency is kept, and rows without a usable price are dropped. Tokens without a price
 * cannot be swapped, as allowed by the challenge.
 */
export function parsePrices(raw: unknown): PriceList {
  if (!Array.isArray(raw)) throw new Error("Unexpected price feed format");

  const latest = new Map<string, PriceEntry & { time: number }>();
  for (const entry of raw) {
    if (!isPriceEntry(entry)) continue;
    const time = Date.parse(entry.date);
    const safeTime = Number.isNaN(time) ? 0 : time;
    const existing = latest.get(entry.currency);
    // `>=` means that on equal timestamps the later row in the feed wins.
    if (!existing || safeTime >= existing.time) latest.set(entry.currency, { ...entry, time: safeTime });
  }

  const entries = [...latest.values()];
  const tokens = entries
    .map((e) => ({ symbol: e.currency, priceUsd: e.price, iconUrl: `${ICON_BASE_URL}/${e.currency}.svg` }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol, "en", { sensitivity: "base" }));
  const newest = Math.max(0, ...entries.map((e) => e.time));

  return { tokens, updatedAt: newest > 0 ? new Date(newest) : null };
}

export async function fetchPrices(signal?: AbortSignal): Promise<PriceList> {
  const res = await fetch(PRICES_URL, { signal });
  if (!res.ok) throw new Error(`Price service responded with ${res.status}`);
  return parsePrices(await res.json());
}
