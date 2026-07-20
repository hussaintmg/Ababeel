"use client";

import { useSyncExternalStore } from "react";

// Never emits, so the snapshot flips from the server value to the client value
// exactly once, at hydration.
function subscribe() {
  return () => {};
}

/**
 * Returns false during server rendering and the first client render, then true.
 *
 * Preferred over the `useState(false)` + `useEffect(() => setMounted(true))`
 * pattern: it reports the same value without scheduling an extra render pass,
 * and keeps the server and client markup in agreement during hydration.
 */
export default function useHasMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
