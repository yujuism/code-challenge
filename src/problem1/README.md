# Problem 1: Three ways to sum to n

The three implementations are in [`index.js`](./index.js).

| Function     | Approach                                    | Time | Space    |
| ------------ | ------------------------------------------- | ---- | -------- |
| `sum_to_n_a` | Formula `n(n + 1) / 2`                      | O(1) | O(1)     |
| `sum_to_n_b` | Loop                                        | O(n) | O(1)     |
| `sum_to_n_c` | Recursion that splits the range in half     | O(n) | O(log n) |

`sum_to_n_c` splits the range in half instead of doing `n + sum(n - 1)`. The simple
version runs out of call stack at around n = 10,000, while valid inputs go up to about
134 million.

For `0` the result is `0`. Negative numbers mirror positive ones, so `sum_to_n(-3)` is `-6`.

## Running the tests

From the repository root:

```bash
node --test src/problem1/index.test.js
```
