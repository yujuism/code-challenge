// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WalletPage from "./WalletPage";

type Balance = ReturnType<typeof useWalletBalances>[number];
type RowProps = Parameters<typeof WalletRow>[0];

// The component relies on globals from the surrounding codebase (see external.d.ts).
// They are stubbed here so the component can render and each WalletRow's props can be inspected.
const rowSpy = vi.fn<(props: RowProps) => null>(() => null);

function renderWith(balances: Balance[], prices: Record<string, number>) {
  vi.stubGlobal("useWalletBalances", () => balances);
  vi.stubGlobal("usePrices", () => prices);
  render(<WalletPage />);
  return rowSpy.mock.calls.map(([props]) => props);
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  rowSpy.mockClear();
  vi.stubGlobal("WalletRow", rowSpy);
  vi.stubGlobal("classes", { row: "row" });
});

describe("WalletPage (refactored)", () => {
  it("keeps only positive balances on supported chains (issue 1, 2)", () => {
    const rows = renderWith(
      [
        { currency: "ETH", amount: 2, blockchain: "Ethereum" },
        { currency: "ATOM", amount: 0, blockchain: "Osmosis" },
        { currency: "NEG", amount: -1, blockchain: "Arbitrum" },
        { currency: "XYZ", amount: 5, blockchain: "UnknownChain" },
      ],
      { ETH: 1600 },
    );
    expect(rows.map((r) => r.amount)).toEqual([2]);
  });

  it("sorts by blockchain priority, highest first, keeping order for ties (issue 4)", () => {
    const rows = renderWith(
      [
        { currency: "ZIL", amount: 1, blockchain: "Zilliqa" },
        { currency: "ARB", amount: 2, blockchain: "Arbitrum" },
        { currency: "NEO", amount: 3, blockchain: "Neo" },
        { currency: "OSMO", amount: 4, blockchain: "Osmosis" },
        { currency: "ETH", amount: 5, blockchain: "Ethereum" },
      ],
      {},
    );
    // Osmosis 100, Ethereum 50, Arbitrum 30, then Zilliqa / Neo (20) in original order.
    expect(rows.map((r) => r.amount)).toEqual([4, 5, 2, 1, 3]);
  });

  it("passes a real formatted amount instead of undefined (issue 5, 6)", () => {
    const [row] = renderWith([{ currency: "ETH", amount: 0.0042, blockchain: "Ethereum" }], { ETH: 1600 });
    expect(row.formattedAmount).toBe((0.0042).toLocaleString(undefined, { maximumFractionDigits: 6 }));
    expect(row.formattedAmount).not.toBe("0");
  });

  it("computes the USD value, and never NaN when a price is missing (issue 11)", () => {
    const rows = renderWith(
      [
        { currency: "ETH", amount: 2, blockchain: "Ethereum" },
        { currency: "NOPRICE", amount: 3, blockchain: "Arbitrum" },
      ],
      { ETH: 1600 },
    );
    expect(rows.map((r) => r.usdValue)).toEqual([3200, 0]);
  });
});
