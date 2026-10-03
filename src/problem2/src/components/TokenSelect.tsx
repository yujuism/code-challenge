import { useId, useRef, useState } from "react";
import type { Token } from "../lib/prices";
import { formatUsd } from "../lib/amount";
import { TokenIcon } from "./TokenIcon";

interface TokenSelectProps {
  /** Accessible name of the picker, e.g. "Token to send". */
  label: string;
  tokens: Token[];
  selected: Token | undefined;
  disabled?: boolean;
  onSelect: (symbol: string) => void;
}

/**
 * A button that opens a searchable token list in a native <dialog>.
 * `showModal()` provides focus trapping, Esc-to-close and a backdrop for free.
 * A <select> can't show token logos or prices.
 */
export function TokenSelect({ label, tokens, selected, disabled, onSelect }: TokenSelectProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const titleId = useId();

  const normalized = query.trim().toLowerCase();
  const visible = normalized ? tokens.filter((t) => t.symbol.toLowerCase().includes(normalized)) : tokens;

  const open = () => {
    setQuery("");
    dialogRef.current?.showModal();
    searchRef.current?.focus();
  };
  const choose = (symbol: string) => {
    onSelect(symbol);
    dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        className="token-trigger"
        onClick={open}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-label={selected ? `${label}: ${selected.symbol}. Change token` : `${label}: select a token`}
      >
        {selected ? (
          <>
            <TokenIcon key={selected.symbol} token={selected} size={24} />
            <span className="token-trigger__symbol">{selected.symbol}</span>
          </>
        ) : (
          <span className="token-trigger__symbol">Select</span>
        )}
        <svg className="token-trigger__chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        className="token-dialog"
        aria-labelledby={titleId}
        // Clicking the backdrop targets the <dialog> element itself; close on that.
        onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
      >
        <div className="token-dialog__body">
          <header className="token-dialog__header">
            <h2 id={titleId}>{label}</h2>
            <button type="button" className="icon-button" onClick={() => dialogRef.current?.close()} aria-label="Close">
              ×
            </button>
          </header>
          <input
            className="token-dialog__search"
            type="search"
            placeholder="Search by symbol"
            aria-label="Search tokens"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            ref={searchRef}
          />
          <ul className="token-list">
            {visible.map((token) => (
              <li key={token.symbol}>
                <button
                  type="button"
                  className="token-list__item"
                  aria-current={token.symbol === selected?.symbol ? "true" : undefined}
                  onClick={() => choose(token.symbol)}
                >
                  <TokenIcon token={token} />
                  <span className="token-list__symbol">{token.symbol}</span>
                  <span className="token-list__price">{formatUsd(token.priceUsd)}</span>
                </button>
              </li>
            ))}
            {visible.length === 0 && <li className="token-list__empty">No tokens match “{query}”.</li>}
          </ul>
        </div>
      </dialog>
    </>
  );
}
