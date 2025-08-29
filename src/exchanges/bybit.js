import fetch from "node-fetch";
import ExchangeAdapter from "./adapter.js";

export default class BybitAdapter extends ExchangeAdapter {
  constructor(cfg) {
    super(cfg);
    this.restBase = cfg.bybitRestBase ||
      (cfg.useTestnet ? "https://api-testnet.bybit.com" : "https://api.bybit.com");
  }

  async getLastPrice(symbol) {
    try {
      const url = `${this.restBase}/v5/market/tickers?category=linear&symbol=${encodeURIComponent(symbol)}`;
      const r = await fetch(url);
      const j = await r.json();
      const p = Number(j?.result?.list?.[0]?.lastPrice);
      return Number.isFinite(p) ? p : null;
    } catch {
      return null;
    }
  }
}
