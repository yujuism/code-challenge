import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Token } from "../lib/prices";
import { submitSwap, type SwapReceipt } from "../lib/swap";
import { SwapForm } from "./SwapForm";

vi.mock("../lib/swap", () => ({ submitSwap: vi.fn() }));

const token = (symbol: string, priceUsd: number): Token => ({ symbol, priceUsd, iconUrl: `/${symbol}.svg` });
const TOKENS = [token("ATOM", 10), token("ETH", 1600), token("USDC", 1)];

const sendInput = () => screen.getByLabelText("Amount to send");
const receiveInput = () => screen.getByLabelText("Amount to receive");

describe("SwapForm", () => {
  it("defaults to sending ETH for USDC and asks for an amount", () => {
    render(<SwapForm tokens={TOKENS} />);
    expect(screen.getByRole("button", { name: /Token to send: ETH/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Token to receive: USDC/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter an amount" })).toBeDisabled();
  });

  it("computes the receive amount from the send amount, and vice versa", async () => {
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);

    await user.type(sendInput(), "2");
    expect(receiveInput()).toHaveValue("3200");
    // Both sides are worth the same in USD.
    expect(screen.getAllByText("≈ $3,200.00")).toHaveLength(2);

    await user.clear(receiveInput());
    await user.type(receiveInput(), "800");
    expect(sendInput()).toHaveValue("0.5");
  });

  it("ignores non-numeric keystrokes", async () => {
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);
    await user.type(sendInput(), "1a.b5.");
    expect(sendInput()).toHaveValue("1.5");
  });

  it("shows a validation error for a zero amount", async () => {
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);
    await user.type(sendInput(), "0");
    expect(screen.getByText("Enter an amount greater than 0")).toBeInTheDocument();
    expect(sendInput()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Confirm swap" })).toBeDisabled();
  });

  it("flips tokens while keeping the typed amount on its token", async () => {
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);
    await user.type(sendInput(), "2");
    await user.click(screen.getByRole("button", { name: "Switch send and receive tokens" }));

    expect(screen.getByRole("button", { name: /Token to send: USDC/ })).toBeInTheDocument();
    expect(sendInput()).toHaveValue("3200");
    expect(receiveInput()).toHaveValue("2");
  });

  it("selecting the opposite side's token flips instead of duplicating it", async () => {
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);
    await user.click(screen.getByRole("button", { name: /Token to send: ETH/ }));
    // The picker for "Token to send" lists every token; choose USDC (currently the receive token).
    const dialog = screen.getAllByRole("dialog", { hidden: true })[0];
    await user.click(within(dialog).getByRole("button", { name: /USDC/ }));

    expect(screen.getByRole("button", { name: /Token to send: USDC/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Token to receive: ETH/ })).toBeInTheDocument();
  });

  it("submits, shows progress, then confirms the swap", async () => {
    let resolve!: (receipt: SwapReceipt) => void;
    vi.mocked(submitSwap).mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);

    await user.type(sendInput(), "2");
    await user.click(screen.getByRole("button", { name: "Confirm swap" }));

    expect(submitSwap).toHaveBeenCalledWith({ from: "ETH", to: "USDC", amountIn: 2, amountOut: 3200 });
    expect(screen.getByRole("button", { name: "Swapping…" })).toBeDisabled();
    expect(sendInput()).toBeDisabled();

    await act(async () => resolve({ id: "1", from: "ETH", to: "USDC", amountIn: 2, amountOut: 3200 }));

    expect(screen.getByRole("status")).toHaveTextContent("Swapped 2 ETH for 3200 USDC");
    expect(sendInput()).toHaveValue("");
  });

  it("shows an error when the swap fails and keeps the amount", async () => {
    vi.mocked(submitSwap).mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<SwapForm tokens={TOKENS} />);

    await user.type(sendInput(), "2");
    await user.click(screen.getByRole("button", { name: "Confirm swap" }));

    expect(await screen.findByText("Swap failed. Please try again.")).toBeInTheDocument();
    expect(sendInput()).toHaveValue("2");
    expect(screen.getByRole("button", { name: "Confirm swap" })).toBeEnabled();
  });
});
