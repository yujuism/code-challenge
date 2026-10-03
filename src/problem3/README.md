# Problem 3: Messy React

- Original code, copied from the challenge: [`WalletPage.original.tsx`](./WalletPage.original.tsx)
- Refactored version: [`WalletPage.tsx`](./WalletPage.tsx)

## How to check

The snippet uses `useWalletBalances`, `usePrices`, `WalletRow`, `BoxProps` and `classes`
without defining them. [`external.d.ts`](./external.d.ts) describes what they are assumed
to look like, so both versions can be type-checked.

Requires Node.js 22.22+, 24.15+ or 26+ (Node 24 LTS recommended).

```bash
cd src/problem3
npm install
npm run typecheck            # refactored version, passes
npm test                     # renders the refactored version with fake data
npm run typecheck:original   # original version, fails
```

The original fails with these errors, which match issues 1, 3 and 4 below. The missing
`useMemo` import is only because the snippet has no imports.

```
Cannot find name 'useMemo'.
Property 'blockchain' does not exist on type 'WalletBalance'.        (issue 3)
Cannot find name 'lhsPriority'.                                      (issue 1)
Argument of type '(lhs, rhs) => 1 | -1 | undefined' is not assignable
  to parameter of type '(a, b) => number'.                           (issue 4)
```

The tests check that the refactored version:

- shows only positive balances on supported chains (issues 1 and 2)
- sorts by chain priority and keeps the original order for ties (issue 4)
- passes a formatted amount instead of `undefined` or `"0"` (issues 5 and 6)
- passes a USD value of `0` instead of `NaN` when a price is missing (issue 11)

## Issues

Issues 1–7 are bugs that give wrong output or crash, 8–10 are wasted computation, and
11–17 are anti-patterns and typing problems.

### Bugs

#### 1. `lhsPriority` is not defined

```ts
const balancePriority = getPriority(balance.blockchain);
if (lhsPriority > -99) {
```

`lhsPriority` doesn't exist. TypeScript won't compile it, and in plain JavaScript it
throws a `ReferenceError` on the first render. It should be `balancePriority`.

#### 2. The filter keeps the wrong balances

```ts
if (balance.amount <= 0) return true;
```

Even with the name fixed, this keeps only zero and negative balances and removes all the
positive ones. A wallet page should show what the user holds, so the condition should be
`balance.amount > 0`.

#### 3. `WalletBalance` has no `blockchain` field

The filter and the sort both read `balance.blockchain`, but the interface only has
`currency` and `amount`. It should be added to the interface.

#### 4. The sort function doesn't return 0 for equal priorities

```ts
if (leftPriority > rightPriority) return -1;
else if (rightPriority > leftPriority) return 1;
// equal priorities: returns undefined
```

When two priorities are equal the function returns `undefined`. JavaScript happens to
treat that as `0`, but a compare function is supposed to always return a number.
`rhs.priority - lhs.priority` gives the same order and returns `0` for ties. `sort()` is
stable, so balances with the same priority keep their original order.

#### 5. `rows` uses a field that is never set

`formattedBalances` is created but never used. `rows` maps over `sortedBalances` and
labels each item as `FormattedWalletBalance`, so `balance.formatted` is always
`undefined` and every row gets an empty `formattedAmount`. With strict TypeScript and
typed hooks this doesn't compile. It only compiles when the hooks return `any`, and then
the wrong type hides the bug. The refactored version formats the amount where it's used.

#### 6. `toFixed()` with no argument rounds to whole numbers

`(0.0042).toFixed()` returns `"0"`, which loses most of a small token balance. The
refactored version uses `Intl.NumberFormat` with up to 6 decimals. The right number of
decimals is a product decision.

#### 7. `key={index}`

The list is sorted, so its order changes when balances change. With the index as the key,
React can match a row to the wrong balance after a re-sort, which causes extra re-renders
or a row showing the wrong state. `blockchain:currency` is unique and stays the same.

### Wasted computation

#### 8. `prices` is a `useMemo` dependency but isn't used

```ts
}, [balances, prices]);
```

The calculation inside `useMemo` never reads `prices`. Prices usually change much more
often than balances, so every price update re-runs the filter and the sort for nothing.
The dependency list should be `[balances]`.

#### 9. `getPriority` runs again on every comparison

Sorting does about `n log n` comparisons, and each one calls `getPriority` twice. The
refactored version works out each balance's priority once before filtering and sorting,
so the comparison is just a subtraction.

#### 10. Extra loops

`formattedBalances` is a full extra loop over the list whose result is thrown away (see
issue 5). The refactored version does one filter and sort inside `useMemo`, then one map
to render.

Note that `balances.filter(...).sort(...)` does not change the array from the hook,
because `filter` already returns a new array.

### Anti-patterns and typing

#### 11. A missing price gives `NaN`

`prices[balance.currency] * balance.amount` is `NaN` when a currency has no price. The
refactored version uses `0` instead. That still isn't quite right, since the value is
unknown rather than zero. If `WalletRow` can be changed, a better option is to make
`usdValue` optional and show "—" when it's missing.

#### 12. `getPriority(blockchain: any)`

`any` turns off type checking for the value that drives filtering and sorting. It should
be `string`, or a union of the known chain names.

#### 13. `getPriority` is declared inside the component

It doesn't use props or state, but it's recreated on every render. It's also used inside
`useMemo` without being in the dependency list, which the `react-hooks/exhaustive-deps`
lint rule reports. Moving it outside the component fixes both. A lookup object
(`Record<string, number>`) is also easier to read and change than the `switch`.

#### 14. Magic number `-99`

`-99` means "unsupported chain" and appears twice with no name. The refactored version
uses a named constant, `UNSUPPORTED_PRIORITY`.

#### 15. Repeated and unnecessary types

- `React.FC<Props> = (props: Props) =>` declares the props type twice. Destructuring in
  the parameters is enough.
- `interface Props extends BoxProps {}` adds nothing over using `BoxProps` directly.

#### 16. `children` is thrown away

`children` is taken out of `props` and never rendered, so anything passed as children
disappears. This might be intended, so the refactored version keeps the same behaviour.
If it isn't intended, `{children}` should be rendered, or removed from the props.

#### 17. `classes` is not defined in the snippet

`classes.row` probably comes from a `useStyles()` hook or a CSS module that wasn't
included in the snippet. The refactored version leaves it as it is.

## Why there is no extra memoisation

`rows` depends on `prices`, which is the value that changes most often, so wrapping it in
`useMemo` would recalculate almost every render anyway. Building the row elements is
cheap, so `useMemo` or `useCallback` there would add code without a real benefit. If
rendering `WalletRow` itself turned out to be slow, wrapping it in `React.memo` would let
React skip rows whose props didn't change, but that should come from profiling, not by
default.
