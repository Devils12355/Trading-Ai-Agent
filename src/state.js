/**
 * In-memory runtime state
 * Stores active signals & orders (for quick lookup while bot is running)
 */

export const state = {
  signals: {}, // signalId -> signal object
  orders: {},  // orderId -> order object
};

/**
 * Add or update a signal in memory
 */
export function upsertSignal(signalId, signal) {
  state.signals[signalId] = signal;
}

/**
 * Add or update an order in memory
 */
export function upsertOrder(orderId, order) {
  state.orders[orderId] = order;
}

/**
 * Get active signals
 */
export function getSignals() {
  return Object.values(state.signals);
}

/**
 * Get active orders
 */
export function getOrders() {
  return Object.values(state.orders);
}

/**
 * Remove closed order
 */
export function removeOrder(orderId) {
  delete state.orders[orderId];
}
