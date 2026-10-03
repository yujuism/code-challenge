import test from "node:test";
import assert from "node:assert/strict";
import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from "./sum_to_n.ts";

const impls = { sum_to_n_a, sum_to_n_b, sum_to_n_c };
const cases: Array<[number, number]> = [
  [0, 0],
  [1, 1],
  [5, 15],
  [100, 5050],
  [-1, -1],
  [-5, -15],
];

for (const [name, fn] of Object.entries(impls)) {
  test(name, () => {
    for (const [n, expected] of cases) assert.equal(fn(n), expected, `${name}(${n})`);
  });
}

test("implementations agree on larger inputs", () => {
  for (const n of [999, 1_000_000, -123_457]) {
    const expected = sum_to_n_a(n);
    assert.equal(sum_to_n_b(n), expected);
    assert.equal(sum_to_n_c(n), expected);
  }
});

test("closed form stays exact at the largest valid input", () => {
  // 134_217_727 is the largest n whose sum is still a safe integer.
  assert.equal(sum_to_n_a(134_217_727), 9_007_199_187_632_128);
});

test("recursion does not overflow the stack", () => {
  assert.equal(sum_to_n_c(1_000_000), 500_000_500_000);
});
