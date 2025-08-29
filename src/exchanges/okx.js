import fetch from "node-fetch";
import ExchangeAdapter from "./adapter.js";

function toOKX(symbol) {
  // BTCUSDT -> BTC-USDT-SWAP (simple mapping for USDT perpetual)
  if (!/USDT$/i.test(symbol)) return null;
  const base = symbol.replace(/USDT$/i, "");
  return `${base}-USDT-SWAP`;
}

export default class OKXAdapter extends ExchangeAdapter {
  constructor(cfg) {
    super(cfg);
    this.restBase = "https://www.okx.com";
  }

  async getLastPrice(symbol) {
    try {
      const instId = toOKX(symbol);
      if (!instId) return null;
      const url = `${this.restBase}/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`;
      const r = await fetch(url);
      const j = await r.json();
      const p = Number(j?.data?.[0]?.last);
      return Number.isFinite(p) ? p : null;
    } catch {
      return null;
    }
  }
}
