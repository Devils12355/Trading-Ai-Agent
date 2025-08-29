import dotenv from "dotenv";

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  simMode: process.env.SIM_MODE === "true",

  // Trading Window (India Time)
  istStart: process.env.IST_TRADING_START || "10:00",
  istEnd: process.env.IST_TRADING_END || "22:00",

  // Telegram
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,

  // Exchange
  exchange: process.env.EXCHANGE || "BYBIT", // BYBIT | OKX | BINANCE
  useTestnet: process.env.USE_TESTNET === "true",

  // Bybit
  bybitKey: process.env.BYBIT_API_KEY,
  bybitSecret: process.env.BYBIT_API_SECRET,
  bybitRestBase:
    process.env.BYBIT_REST_BASE ||
    (process.env.USE_TESTNET === "true"
      ? "https://api-testnet.bybit.com"
      : "https://api.bybit.com"),
  bybitWsPrivate:
    process.env.BYBIT_WS_PRIVATE ||
    (process.env.USE_TESTNET === "true"
      ? "wss://stream-testnet.bybit.com/v5/private"
      : "wss://stream.bybit.com/v5/private"),

  // OKX
  okxKey: process.env.OKX_API_KEY,
  okxSecret: process.env.OKX_API_SECRET,
  okxPassphrase: process.env.OKX_API_PASSPHRASE,

  // Binance
  binanceKey: process.env.BINANCE_API_KEY,
  binanceSecret: process.env.BINANCE_API_SECRET,

  // MySQL
  dbHost: process.env.DB_HOST || "127.0.0.1",
  dbPort: process.env.DB_PORT || 3306,
  dbUser: process.env.DB_USER || "root",
  dbPass: process.env.DB_PASS || "",
  dbName: process.env.DB_NAME || "trading_agent",

  // TF Defaults
  tfHTF: process.env.TF_HTF || "1D",
  tfMTF: process.env.TF_MTF || "4H",
  tfLTF: process.env.TF_LTF || "1H",
};
