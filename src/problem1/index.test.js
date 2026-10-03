// Run: node --test src/problem1/index.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { sum_to_n_a, sum_to_n_b, sum_to_n_c } = require("./index.js");

const impls = { sum_to_n_a, sum_to_n_b, sum_to_n_c };
const cases = [
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

test("closed form stays exact near MAX_SAFE_INTEGER", () => {
  // Largest n whose sum is still a safe integer.
  const n = 134_217_727;
  assert.equal(sum_to_n_a(n), 9_007_199_187_632_128);
  assert.ok(Number.isSafeInteger(sum_to_n_a(n)));
});
