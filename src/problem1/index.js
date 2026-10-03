/**
 * Problem 1: Three ways to sum to n.
 *
 * sum_to_n(n) === 1 + 2 + ... + n
 *
 * Assumptions (the spec only says "any integer"):
 *   - sum_to_n(0) === 0
 *   - negative n mirrors positive n: sum_to_n(-3) === -1 + -2 + -3 === -6
 *   - the result always fits in Number.MAX_SAFE_INTEGER (given by the spec)
 */

// A: closed-form (Gauss). O(1) time, O(1) space.
// Halve whichever factor is even *before* multiplying so the intermediate
// product never exceeds the final result.
var sum_to_n_a = function (n) {
  var m = Math.abs(n);
  var sum = m % 2 === 0 ? (m / 2) * (m + 1) : m * ((m + 1) / 2);
  return n < 0 ? -sum : sum;
};

// B: plain loop. O(n) time, O(1) space.
var sum_to_n_b = function (n) {
  var step = n < 0 ? -1 : 1;
  var sum = 0;
  for (var i = step; Math.abs(i) <= Math.abs(n); i += step) sum += i;
  return sum;
};

// C: divide and conquer recursion. O(n) time, O(log n) stack depth.
// A naive `n + sum(n - 1)` recursion overflows the call stack around n ≈ 10^4;
// splitting the range in half keeps the depth logarithmic.
var sum_to_n_c = function (n) {
  var sumRange = function (lo, hi) {
    if (lo > hi) return 0;
    if (lo === hi) return lo;
    var mid = Math.floor((lo + hi) / 2);
    return sumRange(lo, mid) + sumRange(mid + 1, hi);
  };
  return n < 0 ? -sumRange(1, -n) : sumRange(1, n);
};

module.exports = { sum_to_n_a, sum_to_n_b, sum_to_n_c };
