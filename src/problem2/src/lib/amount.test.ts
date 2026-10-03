import { describe, expect, it } from "vitest";
import { convert, formatAmount, formatUsd, parseAmount, sanitizeAmountInput } from "./amount";

describe("sanitizeAmountInput", () => {
  it.each(["", "0", "12", "1.", ".5", "0.000001"])("accepts %j", (raw) => {
    expect(sanitizeAmountInput(raw)).toBe(raw);
  });

  it("treats a comma as the decimal separator", () => {
    expect(sanitizeAmountInput("1,5")).toBe("1.5");
  });

  it.each(["abc", "1.2.3", "-1", "1e5", "1 000"])("rejects %j", (raw) => {
    expect(sanitizeAmountInput(raw)).toBeNull();
  });
});

describe("parseAmount", () => {
  it("returns null for incomplete input", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount(".")).toBeNull();
  });

  it("parses partial decimals", () => {
    expect(parseAmount("1.")).toBe(1);
    expect(parseAmount(".5")).toBe(0.5);
  });
});

describe("convert", () => {
  it("converts via USD prices", () => {
    // 2 ETH @ $1600 = $3200 = 3200 USDC @ $1
    expect(convert(2, 1600, 1)).toBe(3200);
    expect(convert(3200, 1, 1600)).toBe(2);
  });
});

describe("formatAmount", () => {
  it("never uses exponent notation or grouping", () => {
    expect(formatAmount(0.00000123)).toBe("0.00000123");
    expect(formatAmount(1234567.5)).toBe("1234567.5");
  });

  it("trims float noise", () => {
    expect(formatAmount(0.1 + 0.2)).toBe("0.3");
    expect(formatAmount(123456789.123456)).toBe("123456789.1");
  });
});

describe("formatUsd", () => {
  it("formats dollars and flags sub-cent values", () => {
    expect(formatUsd(1234.5)).toBe("$1,234.50");
    expect(formatUsd(0.001)).toBe("< $0.01");
    expect(formatUsd(0)).toBe("$0.00");
  });
});
