export interface SwapRequest {
  from: string;
  to: string;
  amountIn: number;
  amountOut: number;
}

export interface SwapReceipt extends SwapRequest {
  id: string;
}

/**
 * Simulated backend call. There is no real swap service in this challenge, so this only
 * waits to mimic network latency and echoes the request back as a receipt. Nothing is sent
 * anywhere and no balances change.
 */
export async function submitSwap(request: SwapRequest, delayMs = 1500): Promise<SwapReceipt> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return { ...request, id: crypto.randomUUID() };
}
