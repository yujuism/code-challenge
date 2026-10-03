// The snippet uses these from the surrounding codebase without defining them.
// These declarations are assumptions about their shape, so both versions can be type-checked.
import type React from "react";

declare global {
  interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {}

  function useWalletBalances(): { currency: string; amount: number; blockchain: string }[];
  function usePrices(): Record<string, number>;

  const classes: { row: string };
  const WalletRow: React.FC<{
    className?: string;
    amount: number;
    usdValue: number;
    formattedAmount: string;
  }>;
}
