# Problem 2: Fancy Form

A currency swap form built with Vite, React 19 and TypeScript, styled with plain CSS.

Requires Node.js 22.22+, 24.15+ or 26+ (Node 24 LTS recommended).

```bash
cd src/problem2
npm install
npm run dev         # http://localhost:5173
npm test            # unit and component tests
npm run lint
npm run build       # type-check and production build
```

## Features

- Token prices come from `https://interview.switcheo.com/prices.json`, and icons from the
  Switcheo `token-icons` repo. Tokens without an icon show their initials instead.
- Either amount can be edited. Typing in "Amount to send" fills in "Amount to receive",
  and the other way around. Both sides show the value in USD, and a line below shows the
  rate (`1 ETH ≈ 1646.134136 USDC`).
- Tokens are picked from a searchable list in a native `<dialog>`, which handles focus,
  the Esc key and the backdrop. Picking the token that is already on the other side swaps
  the two.
- The arrow button between the fields swaps the tokens. The typed amount stays with its
  token.
- Only numbers can be typed (a comma works as a decimal point), and an amount of zero
  shows an error under the field. The button text explains what is missing, for example
  "Select a token" or "Enter an amount".
- While submitting, the button shows a spinner and the form is disabled. The result
  message is read out by screen readers.
- There are loading, error (with a retry button) and "no tokens" states. The page
  supports light and dark mode, works down to 320 px wide, and respects reduced motion.

## Structure

```
index.html               entry page (from the template)
style.css                all styles (from the template)
src/
  lib/prices.ts          fetches and cleans up the price feed
  lib/amount.ts          input checks, conversion and number formatting
  lib/swap.ts            simulated swap request
  hooks/useTokenPrices   loading, error and retry state for prices
  components/            SwapForm, AmountField, TokenSelect, TokenIcon
```

`SwapForm` only stores the field the user typed into. The other field is calculated from
it on every render, so the two amounts can never get out of sync.

## Assumptions

- The swap is simulated: `submitSwap` waits 1.5 seconds and returns a receipt. There is no
  wallet or real transaction, and the success message says so. Balances and a "Max" button
  were left out because there is no balance data to show.
- The price feed has some currencies more than once (for example `BUSD`). The most recent
  entry is used. Rows with a missing, non-numeric or zero price are skipped, as the brief
  allows.
- The rate is `amount × fromPrice / toPrice`, without fees or slippage, since the feed only
  has USD prices.
- Amounts are plain JavaScript numbers. That is fine for showing an estimate, but a real
  swap would need exact amounts from the backend. Displayed amounts are rounded to at
  most 8 decimals and 10 significant digits.
- The price feed is a fixed snapshot from 2023, so it is loaded once and the page shows
  its date.
- The form is built on the provided template: `index.html` is still the entry page,
  `style.css` holds the styles, and the labels and input IDs (`input-amount`,
  `output-amount`) are kept. The template's `script.js` is replaced by `src/main.tsx`,
  because Vite needs a module as its entry point.
