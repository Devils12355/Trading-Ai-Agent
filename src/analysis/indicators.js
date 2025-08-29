/**
 * Minimal deterministic indicators — production में real candles + TA lib use करना।
 */

export function sma(arr, period) {
  if (!Array.isArray(arr) || arr.length < period) return null;
  let sum = 0;
  for (let i = arr.length - period; i < arr.length; i++) sum += Number(arr[i] || 0);
  return sum / period;
}

export function rsi(closes, period = 14) {
  if (!Array.isArray(closes) || closes.length < period + 1) return null;
  let gains = 0,
    losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const rs = gains / (losses || 1e-9);
  return 100 - 100 / (1 + rs);
}

/**
 * Structure bias heuristic: SMA20 vs SMA50
 */
export function structureBias({ closes }) {
  if (!closes || closes.length < 50) return "neutral";
  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  if (s20 == null || s50 == null) return "neutral";
  if (s20 > s50) return "bullish";
  if (s20 < s50) return "bearish";
  return "neutral";
}

/**
 * LLM bias और indicator bias का gate
 */
export function confluenceGate({ biasLLM, biasIndi }) {
  if (!biasLLM || !biasIndi) return false;
  if (biasIndi === "neutral") return false;
  return biasLLM === biasIndi;
}
