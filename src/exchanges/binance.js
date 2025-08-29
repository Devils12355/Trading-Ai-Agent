import fetch from "node-fetch";
import ExchangeAdapter from "./adapter.js";

export default class BinanceAdapter extends ExchangeAdapter {
  constructor(cfg) {
    super(cfg);
    this.restBase = cfg.useTestnet
      ? (process.env.BINANCE_REST_BASE || "https://testnet.binancefuture.com")
      : (process.env.BINANCE_REST_BASE || "https://fapi.binance.com");
  }

  async getLastPrice(symbol) {
    try {
      const url = `${this.restBase}/fapi/v1/ticker/price?symbol=${encodeURIComponent(symbol)}`;
      const r = await fetch(url);
      const j = await r.json();
      const p = Number(j?.price);
      return Number.isFinite(p) ? p : null;
    } catch {
      return null;
    }
  }
}
