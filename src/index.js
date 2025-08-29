import { config } from "./config.js";
import { initDB, query, getSetting } from "./db.js";
import { startBot, notify } from "./notifier.js";
import { initExchange } from "./exchange.js";
import { analyzeMultiTF } from "./analysis/multitf.js";
import { saveSignal, saveOrder } from "./db.js";
import { startPriceWatcher, registerOrderRuntime } from "./orders.js";

/** IST window check */
function withinISTWindow() {
  try {
    const [sh, sm] = (config.istStart || "10:00").split(":").map(Number);
    const [eh, em] = (config.istEnd || "22:00").split(":").map(Number);
    const now = new Date();
    const istNow = new Date(now.getTime() + (5.5 * 60 - now.getTimezoneOffset()) * 60000);
    const mins = istNow.getHours() * 60 + istNow.getMinutes();
    const s = sh * 60 + sm, e = eh * 60 + em;
    return mins >= s && mins <= e;
  } catch { return true; }
}

async function getWhitelistSymbols() {
  const rows = await query(`SELECT setting_key FROM runtime_settings WHERE setting_key LIKE 'wl:%'`);
  const arr = rows.map(r => r.setting_key.slice(3));
  return arr.length ? arr : ["BTCUSDT", "ETHUSDT"];
}

async function main() {
  await initDB();
  startBot();
  initExchange();
  startPriceWatcher(15000);

  await notify("🟢 Agent शुरू हुआ (v17)");

  const userPrompt = `Analyze the market structure in this chart using advanced Price Action + SMC/ICT.
Identify liquidity zones and structural shifts, then propose a high-probability setup with Entry/SL/TP (RR >= 1:5).
Only trade if all confluences are met.`;

  setInterval(async () => {
    try {
      if (!withinISTWindow()) return;

      const symbols = await getWhitelistSymbols();
      for (const symbol of symbols) {
        // Multi-TF analysis
        const res = await analyzeMultiTF({ symbol, prompt: userPrompt });
        if (!res.approve) {
          await notify(`❌ Multi-TF fail (${symbol}): ${res.reason || "not approved"}`);
          continue;
        }

        const sigId = await saveSignal({
          symbol,
          side: res.side,
          entry: res.entry,
          sl: res.sl,
          tp: res.tp,
          rr: res.rr,
          bias: (res.context?.mtf?.bias || res.context?.htf?.bias || null),
          tf_context: `${res.context.HTF}/${res.context.MTF}/${res.context.LTF}`,
          execution_tf: res.context.MTF,
          status: "APPROVED",
        });

        // Position size (placeholder)
        const qty = 0.01;

        const orderId = await saveOrder({
          signal_id: sigId,
          symbol,
          side: res.side,
          qty,
          entry: res.entry,
          sl: res.sl,
          tp: res.tp,
          status: "OPEN",
          pnl: 0,
          fee: 0,
        });

        registerOrderRuntime({
          orderId,
          symbol,
          side: res.side,
          entry: res.entry,
          sl: res.sl,
          tp: res.tp,
          qty,
        });

        await notify(
          `🧠 *Analysis* (${symbol})\n` +
          `TFs: ${res.context.HTF}/${res.context.MTF}/${res.context.LTF}\n` +
          `Side: *${res.side.toUpperCase()}* | RR: *${res.rr?.toFixed(2)}*\n` +
          `Entry: *${res.entry}* | SL: *${res.sl}* | TP: *${res.tp}*` +
          `${config.simMode ? " (SIM)" : ""}`
        );
      }
    } catch (e) {
      await notify(`❗ Loop error: ${e.message || e}`);
    }
  }, 60 * 1000);
}

main().catch(async (e) => {
  await notify("❌ Fatal: " + (e.message || e));
  process.exit(1);
});
