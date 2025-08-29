import { config } from "./config.js";
import BybitAdapter from "./exchanges/bybit.js";
import OKXAdapter from "./exchanges/okx.js";
import BinanceAdapter from "./exchanges/binance.js";

let exchange;

/**
 * Initialize exchange adapter
 */
export function initExchange() {
  switch (config.exchange.toUpperCase()) {
    case "BYBIT":
      exchange = new BybitAdapter(config);
      break;
    case "OKX":
      exchange = new OKXAdapter(config);
      break;
    case "BINANCE":
      exchange = new BinanceAdapter(config);
      break;
    default:
      throw new Error("Unsupported exchange: " + config.exchange);
  }
  return exchange;
}

/**
 * Get exchange adapter instance
 */
export function getExchange() {
  if (!exchange) throw new Error("Exchange not initialized. Call initExchange() first.");
  return exchange;
}
