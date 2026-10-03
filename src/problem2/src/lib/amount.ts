/** Digits with at most one decimal point. Allows partial input such as "", "1." and ".5". */
const AMOUNT_PATTERN = /^\d*\.?\d*$/;

/**
 * Normalises what the user typed into an amount field.
 * Returns `null` when the change should be rejected, so the field keeps its previous value.
 */
export function sanitizeAmountInput(raw: string): string | null {
  const value = raw.replace(",", ".").trim();
  return AMOUNT_PATTERN.test(value) ? value : null;
}

/** Parses a sanitised amount. Returns `null` for empty or non-numeric input ("", "."). */
export function parseAmount(value: string): number | null {
  if (value === "" || value === ".") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Converts `amount` of a token priced at `fromPriceUsd` into a token priced at `toPriceUsd`. */
export function convert(amount: number, fromPriceUsd: number, toPriceUsd: number): number {
  return (amount * fromPriceUsd) / toPriceUsd;
}

// Up to 8 decimals, but never more than 10 significant digits. Whichever rounds harder wins,
// so large amounts don't show meaningless float noise and tiny amounts still show something.
const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 8,
  maximumSignificantDigits: 10,
  roundingPriority: "lessPrecision",
  useGrouping: false,
});

/** Formats a computed amount for an input field: plain digits, no grouping, no exponent. */
export function formatAmount(n: number): string {
  return amountFormatter.format(n);
}

const usdFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatUsd(n: number): string {
  // Sub-cent values would render as "$0.00", which reads like "worthless".
  if (n > 0 && n < 0.01) return "< $0.01";
  return usdFormatter.format(n);
}
