# Trading AI Agent Bot (v17 Full)

## Features
- Hindi Telegram alerts + commands (entry/near-entry/SL/TP/filled/errors)
- Multi-Timeframe pipeline (HTF=1D, MTF=4H, LTF=1H)
- Deterministic indicators (SMA/RSI/structure bias) + LLM analysis
- Bybit/OKX/Binance exchange adapters (Testnet + Mainnet)
- MySQL backend for signals, orders, runtime settings
- Risk management: /risk, /riskx, /cooldown, /autoexecute
- Symbol whitelist/blacklist: /whitelist, /blacklist
- TF presets: /tf preset scalper | swing | investor

## Setup
```bash
git clone https://github.com/<your-username>/Trading-Ai-Agent.git
cd Trading-Ai-Agent
npm install
