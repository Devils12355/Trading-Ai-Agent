import { notify } from "./notifier.js";
import { getExchange } from "./exchange.js";
import { state, upsertOrder } from "./state.js";

/**
 * Register order in memory (for watchers)
 */
export function registerOrderRuntime({ orderId, symbol, side, entry, sl, tp, qty }) {
  upsertOrder(orderId, { orderId, symbol, side, entry, sl, tp, qty, filled: false });
}

/**
 * Simple price watcher — near entry/SL/TP alerts
 */
export function startPriceWatcher(intervalMs = 15000) {
  setInterval(async () => {
    try {
      const ex = getExchange();
      for (const oid in state.orders) {
        const o = state.orders[oid];
        const last = await ex.getLastPrice(o.symbol);
        if (!last) continue;

        const nearPct = (a, b) => Math.abs((a - b) / b * 100);

        if (!o.filled && o.entry && nearPct(last, o.entry) <= 0.2) {
          await notify(`⚠️ कीमत एंट्री के पास: *${last}* (target: ${o.entry})`);
        }
        if (o.sl && nearPct(last, o.sl) <= 0.2) {
          await notify(`⚠️ SL के पास: *${last}* (SL: ${o.sl})`);
        }
        if (o.tp && nearPct(last, o.tp) <= 0.2) {
          await notify(`⚠️ TP के पास: *${last}* (TP: ${o.tp})`);
        }
      }
    } catch (e) {
      await notify(`❗ Price watcher error: ${e.message || e}`);
    }
  }, intervalMs);
}
