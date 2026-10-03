import React, { useMemo } from "react";

// `BoxProps`, `WalletRow`, `useWalletBalances`, `usePrices` and `classes` come from
// the surrounding codebase, exactly as in the original snippet. Their assumed shapes are
// declared in external.d.ts.

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

interface Props extends BoxProps {}

// Static data lives outside the component: it never changes between renders, so there
// is nothing to recreate, and it does not need to appear in any hook dependency list.
const BLOCKCHAIN_PRIORITY: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};
const UNSUPPORTED_PRIORITY = -99;

const getPriority = (blockchain: string): number =>
  BLOCKCHAIN_PRIORITY[blockchain] ?? UNSUPPORTED_PRIORITY;

const amountFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 });

const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const balances: WalletBalance[] = useWalletBalances();
  const prices: Record<string, number> = usePrices();

  // Only depends on `balances`: a price tick no longer re-filters and re-sorts the list.
  const sortedBalances = useMemo(
    () =>
      balances
        // Look up each priority once instead of twice per comparison inside sort().
        .map((balance) => ({ balance, priority: getPriority(balance.blockchain) }))
        .filter(({ balance, priority }) => priority > UNSUPPORTED_PRIORITY && balance.amount > 0)
        .sort((lhs, rhs) => rhs.priority - lhs.priority)
        .map(({ balance }) => balance),
    [balances],
  );

  // Not memoised on purpose: it depends on `prices` (which changes often), so a useMemo
  // would recompute almost every render anyway, and the map itself is cheap.
  const rows = sortedBalances.map((balance) => (
    <WalletRow
      className={classes.row}
      // Stable, unique identity per balance (the index shifts whenever the list re-sorts).
      key={`${balance.blockchain}:${balance.currency}`}
      amount={balance.amount}
      // A missing price should not turn into NaN. See README (issue 11) for the trade-off.
      usdValue={(prices[balance.currency] ?? 0) * balance.amount}
      formattedAmount={amountFormatter.format(balance.amount)}
    />
  ));

  // `children` is still intentionally not rendered, matching the original behaviour. See README.
  return <div {...rest}>{rows}</div>;
};

export default WalletPage;
