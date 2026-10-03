# Problem 4: Three ways to sum to n (TypeScript)

The three implementations, with a complexity comment on each, are in
[`sum_to_n.ts`](./sum_to_n.ts).

The snippet in the brief uses Go's `func` keyword, but the task asks for TypeScript, so
these are regular TypeScript functions with the same names and signatures.

| Function     | Approach                                | Time | Space    | Notes |
| ------------ | --------------------------------------- | ---- | -------- | ----- |
| `sum_to_n_a` | Formula `n(n + 1) / 2`                  | O(1) | O(1)     | The best option. The even factor is halved first, so the intermediate value never gets bigger than the result |
| `sum_to_n_b` | Loop                                    | O(n) | O(1)     | Simple, but does about 134 million additions for the largest valid input |
| `sum_to_n_c` | Recursion that splits the range in half | O(n) | O(log n) | About 10 times slower than the loop in a quick test (n = 10 million), because of the function calls. Splitting keeps the stack about 27 calls deep, while `n + sum(n - 1)` runs out of stack at around n = 10,000 |

`n` is assumed to be an integer whose sum stays below `Number.MAX_SAFE_INTEGER`, as the
brief says. For `0` the result is `0`. Negative numbers mirror positive ones, so
`sum_to_n(-3)` is `-6`.

## Running the tests

Requires Node.js 22.22+, 24.15+ or 26+ (Node 24 LTS recommended).

```bash
cd src/problem4
npm install
npm test
npm run typecheck
```

The tests run the `.ts` files directly with Node's built-in test runner.
