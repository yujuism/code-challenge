import { describe, expect, it } from "vitest";
import { parsePrices } from "./prices";

describe("parsePrices", () => {
  it("keeps the most recent price when a currency appears more than once", () => {
    const { tokens } = parsePrices([
      { currency: "BUSD", date: "2023-08-29T07:10:40.000Z", price: 0.99 },
      { currency: "BUSD", date: "2023-08-29T07:10:50.000Z", price: 1.01 },
      { currency: "BUSD", date: "2023-08-29T07:10:30.000Z", price: 0.5 },
    ]);
    expect(tokens).toEqual([expect.objectContaining({ symbol: "BUSD", priceUsd: 1.01 })]);
  });

  it("on equal timestamps, the later row wins", () => {
    const date = "2023-08-29T07:10:40.000Z";
    const { tokens } = parsePrices([
      { currency: "BUSD", date, price: 0.99 },
      { currency: "BUSD", date, price: 1.01 },
    ]);
    expect(tokens[0].priceUsd).toBe(1.01);
  });

  it("drops malformed rows and tokens without a usable price", () => {
    const { tokens } = parsePrices([
      null,
      "garbage",
      { currency: "", date: "2023-01-01", price: 1 },
      { currency: "ZERO", date: "2023-01-01", price: 0 },
      { currency: "NEG", date: "2023-01-01", price: -3 },
      { currency: "STR", date: "2023-01-01", price: "12" },
      { currency: "ETH", date: "2023-01-01", price: 1600 },
    ]);
    expect(tokens.map((t) => t.symbol)).toEqual(["ETH"]);
  });

  it("sorts symbols case-insensitively and builds icon URLs", () => {
    const { tokens } = parsePrices([
      { currency: "USDC", date: "2023-01-01", price: 1 },
      { currency: "bNEO", date: "2023-01-01", price: 7 },
      { currency: "ATOM", date: "2023-01-01", price: 9 },
    ]);
    expect(tokens.map((t) => t.symbol)).toEqual(["ATOM", "bNEO", "USDC"]);
    expect(tokens[1].iconUrl).toMatch(/\/tokens\/bNEO\.svg$/);
  });

  it("reports the newest timestamp as updatedAt", () => {
    const { updatedAt } = parsePrices([
      { currency: "A", date: "2023-08-29T07:10:40.000Z", price: 1 },
      { currency: "B", date: "2023-08-29T07:10:52.000Z", price: 1 },
    ]);
    expect(updatedAt?.toISOString()).toBe("2023-08-29T07:10:52.000Z");
  });

  it("rejects a feed that is not an array", () => {
    expect(() => parsePrices({ prices: [] })).toThrow();
  });
});
