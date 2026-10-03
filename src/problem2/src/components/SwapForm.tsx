import { useState, type FormEvent } from "react";
import type { Token } from "../lib/prices";
import { convert, formatAmount, parseAmount, sanitizeAmountInput } from "../lib/amount";
import { submitSwap, type SwapReceipt } from "../lib/swap";
import { AmountField } from "./AmountField";

type Side = "from" | "to";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; receipt: SwapReceipt }
  | { kind: "error"; message: string };

interface SwapFormProps {
  tokens: Token[];
}

function defaultSymbol(tokens: Token[], preferred: string, exclude?: string): string | undefined {
  return (tokens.find((t) => t.symbol === preferred && t.symbol !== exclude) ?? tokens.find((t) => t.symbol !== exclude))?.symbol;
}

export function SwapForm({ tokens }: SwapFormProps) {
  const [fromSymbol, setFromSymbol] = useState(() => defaultSymbol(tokens, "ETH"));
  const [toSymbol, setToSymbol] = useState(() => defaultSymbol(tokens, "USDC", fromSymbol));
  // Only the field the user typed into is stored. The other side is always derived from
  // it, so the two amounts can never drift out of sync.
  const [input, setInput] = useState<{ side: Side; value: string }>({ side: "from", value: "" });
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const from = tokens.find((t) => t.symbol === fromSymbol);
  const to = tokens.find((t) => t.symbol === toSymbol);

  const typed = parseAmount(input.value);
  const derived =
    typed !== null && from && to
      ? input.side === "from"
        ? convert(typed, from.priceUsd, to.priceUsd)
        : convert(typed, to.priceUsd, from.priceUsd)
      : null;
  const amountIn = input.side === "from" ? typed : derived;
  const amountOut = input.side === "from" ? derived : typed;
  const display = (side: Side, value: number | null) =>
    input.side === side ? input.value : value === null ? "" : formatAmount(value);

  const amountError = typed !== null && typed <= 0 ? "Enter an amount greater than 0" : null;
  const submitting = status.kind === "submitting";
  const canSubmit = !!from && !!to && amountIn !== null && amountOut !== null && !amountError && !submitting;
  const buttonLabel = submitting
    ? "Swapping…"
    : !from || !to
      ? "Select a token"
      : typed === null
        ? "Enter an amount"
        : "Confirm swap";

  const clearStatus = () => {
    if (status.kind === "success" || status.kind === "error") setStatus({ kind: "idle" });
  };

  const handleAmountChange = (side: Side) => (raw: string) => {
    const value = sanitizeAmountInput(raw);
    if (value === null) return; // reject non-numeric keystrokes, keep the previous value
    setInput({ side, value });
    clearStatus();
  };

  const flip = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    // The typed number stays attached to the same token, now on the other side.
    setInput((prev) => ({ ...prev, side: prev.side === "from" ? "to" : "from" }));
    clearStatus();
  };

  const handleTokenChange = (side: Side) => (symbol: string) => {
    const other = side === "from" ? toSymbol : fromSymbol;
    // Picking the token already on the other side is almost always a request to flip.
    if (symbol === other) return flip();
    (side === "from" ? setFromSymbol : setToSymbol)(symbol);
    clearStatus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: "submitting" });
    try {
      const receipt = await submitSwap({ from: from.symbol, to: to.symbol, amountIn, amountOut });
      setStatus({ kind: "success", receipt });
      setInput({ side: "from", value: "" });
    } catch {
      setStatus({ kind: "error", message: "Swap failed. Please try again." });
    }
  };

  return (
    <form className="swap-card" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      <h1 className="swap-card__title">Swap</h1>

      <AmountField
        id="input-amount"
        label="Amount to send"
        tokenLabel="Token to send"
        value={display("from", amountIn)}
        amount={amountIn}
        token={from}
        tokens={tokens}
        error={input.side === "from" ? amountError : null}
        disabled={submitting}
        onAmountChange={handleAmountChange("from")}
        onTokenChange={handleTokenChange("from")}
      />

      <div className="swap-card__divider">
        <button type="button" className="flip-button" onClick={flip} disabled={submitting} aria-label="Switch send and receive tokens">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 3v14m0 0l-5-5m5 5l5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <AmountField
        id="output-amount"
        label="Amount to receive"
        tokenLabel="Token to receive"
        value={display("to", amountOut)}
        amount={amountOut}
        token={to}
        tokens={tokens}
        error={input.side === "to" ? amountError : null}
        disabled={submitting}
        onAmountChange={handleAmountChange("to")}
        onTokenChange={handleTokenChange("to")}
      />

      <p className="swap-card__rate">
        {from && to ? `1 ${from.symbol} ≈ ${formatAmount(convert(1, from.priceUsd, to.priceUsd))} ${to.symbol}` : " "}
      </p>

      <button type="submit" className="submit-button" disabled={!canSubmit}>
        {submitting && <span className="spinner" aria-hidden="true" />}
        {buttonLabel}
      </button>

      <div className="swap-card__status" role="status" aria-live="polite">
        {status.kind === "success" && (
          <p className="notice notice--success">
            Swapped {formatAmount(status.receipt.amountIn)} {status.receipt.from} for{" "}
            {formatAmount(status.receipt.amountOut)} {status.receipt.to}.{" "}
            <span className="notice__hint">(Simulated. No real transaction was made.)</span>
          </p>
        )}
        {status.kind === "error" && <p className="notice notice--error">{status.message}</p>}
      </div>
    </form>
  );
}
