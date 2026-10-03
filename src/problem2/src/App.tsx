import { SwapForm } from "./components/SwapForm";
import { useTokenPrices } from "./hooks/useTokenPrices";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function App() {
  const { state, retry } = useTokenPrices();

  return (
    <main className="page">
      {state.status === "loading" && (
        <div className="swap-card swap-card--placeholder" role="status">
          <span className="spinner spinner--large" aria-hidden="true" />
          Loading token prices…
        </div>
      )}

      {state.status === "error" && (
        <div className="swap-card swap-card--placeholder" role="alert">
          <p>{state.message}</p>
          <button type="button" className="submit-button" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {state.status === "ready" &&
        (state.tokens.length < 2 ? (
          <div className="swap-card swap-card--placeholder" role="status">
            No tradable tokens are available right now.
          </div>
        ) : (
          <>
            <SwapForm tokens={state.tokens} />
            {state.updatedAt && (
              <p className="page__footnote">Prices as of {dateFormatter.format(state.updatedAt)}</p>
            )}
          </>
        ))}
    </main>
  );
}
