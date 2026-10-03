import { useEffect, useState } from "react";
import { fetchPrices, type PriceList } from "../lib/prices";

export type PricesState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | ({ status: "ready" } & PriceList);

export function useTokenPrices() {
  const [state, setState] = useState<PricesState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchPrices(controller.signal)
      .then((list) => setState({ status: "ready", ...list }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load prices", err);
        setState({ status: "error", message: "Couldn't load token prices. Check your connection and try again." });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  return { state, retry };
}
