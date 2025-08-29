import crypto from "crypto";

/**
 * HMAC SHA256 -> hex digest (Binance/Bybit)
 */
export function hmacSha256Hex(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * HMAC SHA256 -> base64 digest (OKX login)
 */
export function hmacSha256Base64(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64");
}

/**
 * SHA256 hex (कुछ signatures में raw hash चाहिए)
 */
export function sha256Hex(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}
