// Tiny evented store for "API requests in-flight" count.
// Kept framework-agnostic so Axios interceptors can update it directly.
let inFlightCount = 0;
const listeners = new Set();

export function getInFlightCount() {
  return inFlightCount;
}

export function subscribeInFlightCount(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const l of listeners) l(inFlightCount);
}

export function incrementInFlight() {
  inFlightCount += 1;
  emit();
}

export function decrementInFlight() {
  inFlightCount = Math.max(0, inFlightCount - 1);
  emit();
}

