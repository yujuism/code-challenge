import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

const FEED = [
  { currency: "ETH", date: "2023-08-29T07:10:52.000Z", price: 1600 },
  { currency: "USDC", date: "2023-08-29T07:10:40.000Z", price: 1 },
];

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows an error when prices fail to load, and recovers on retry", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify(FEED)));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);
    expect(screen.getByText("Loading token prices…")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load token prices");

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("button", { name: /Token to send: ETH/ })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats a non-2xx response as an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 503 })));
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
