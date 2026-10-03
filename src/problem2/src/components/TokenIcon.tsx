import { useState } from "react";
import type { Token } from "../lib/prices";

/** Token logo, falling back to the symbol's initials when the icon repo has no image for it. */
export function TokenIcon({ token, size = 28 }: { token: Token; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="token-icon token-icon--fallback" style={{ width: size, height: size }} aria-hidden="true">
        {token.symbol.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      className="token-icon"
      src={token.iconUrl}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
