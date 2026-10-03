import { useId } from "react";
import type { Token } from "../lib/prices";
import { formatUsd } from "../lib/amount";
import { TokenSelect } from "./TokenSelect";

interface AmountFieldProps {
  id: string;
  label: string;
  tokenLabel: string;
  value: string;
  /** Exact numeric amount (the displayed `value` may be rounded). */
  amount: number | null;
  token: Token | undefined;
  tokens: Token[];
  error?: string | null;
  disabled?: boolean;
  onAmountChange: (raw: string) => void;
  onTokenChange: (symbol: string) => void;
}

export function AmountField({ id, label, tokenLabel, value, amount, token, tokens, error, disabled, onAmountChange, onTokenChange }: AmountFieldProps) {
  const errorId = useId();
  const usdValue = amount !== null && token ? amount * token.priceUsd : null;

  return (
    <div className={`amount-field${error ? " amount-field--invalid" : ""}`}>
      <label className="amount-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="amount-field__row">
        <input
          id={id}
          className="amount-field__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onAmountChange(e.target.value)}
        />
        <TokenSelect label={tokenLabel} tokens={tokens} selected={token} disabled={disabled} onSelect={onTokenChange} />
      </div>
      <div className="amount-field__meta">
        {error ? (
          <span id={errorId} className="amount-field__error">
            {error}
          </span>
        ) : (
          <span className="amount-field__usd">{usdValue !== null ? `≈ ${formatUsd(usdValue)}` : " "}</span>
        )}
      </div>
    </div>
  );
}
