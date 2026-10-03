/**
 * Problem 4: Three ways to sum to n (TypeScript).
 *
 * sum_to_n(n) === 1 + 2 + ... + n
 *
 * Assumptions (the spec only says "any integer"):
 *   - sum_to_n(0) === 0
 *   - negative n mirrors positive n: sum_to_n(-3) === -1 + -2 + -3 === -6
 *   - n is an integer and the result fits in Number.MAX_SAFE_INTEGER
 *     (given by the spec, so inputs are not re-validated here)
 */

/**
 * A: closed-form (Gauss): n(n + 1) / 2.
 *
 * Time O(1), space O(1). The obvious choice in production.
 * The even factor is halved before multiplying, so the intermediate value never
 * exceeds the final result and stays exact whenever the result is a safe integer.
 */
export function sum_to_n_a(n: number): number {
  const m = Math.abs(n);
  const sum = m % 2 === 0 ? (m / 2) * (m + 1) : m * ((m + 1) / 2);
  return n < 0 ? -sum : sum;
}

/**
 * B: iterative loop.
 *
 * Time O(n), space O(1). Straightforward and obviously correct, but linear:
 * roughly 10^8 additions at the largest valid input (n ≈ 1.34 × 10^8).
 */
export function sum_to_n_b(n: number): number {
  const m = Math.abs(n);
  let sum = 0;
  for (let i = 1; i <= m; i++) sum += i;
  return n < 0 ? -sum : sum;
}

/**
 * C: divide and conquer recursion: sum(lo..hi) = sum(lo..mid) + sum(mid+1..hi).
 *
 * Time O(n): every number is still visited once, plus ~n function calls, which made it
 * about 10x slower than B in a quick benchmark (n = 10^7, Node 24). Space O(log n) call stack.
 * A naive `n + sum(n - 1)` recursion needs O(n) stack and throws RangeError
 * around n ≈ 10^4; halving the range keeps the depth at ~27 for the largest input.
 */
export function sum_to_n_c(n: number): number {
  const sumRange = (lo: number, hi: number): number => {
    if (lo > hi) return 0;
    if (lo === hi) return lo;
    const mid = Math.floor((lo + hi) / 2);
    return sumRange(lo, mid) + sumRange(mid + 1, hi);
  };
  return n < 0 ? -sumRange(1, -n) : sumRange(1, n);
}
