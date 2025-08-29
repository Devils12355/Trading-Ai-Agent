import { Telegraf } from "telegraf";
import { config } from "./config.js";
import { query, setSetting, getSetting } from "./db.js";

let bot = null;

export async function notify(text) {
  if (!config.telegramBotToken || !config.telegramChatId) {
    console.log("[TELEGRAM]", text);
    return;
  }
  try {
    if (!bot) return;
    await bot.telegram.sendMessage(config.telegramChatId, text, { parse_mode: "Markdown" });
  } catch (e) {
    console.error("Telegram error:", e.message || e);
  }
}

async function getWLBL() {
  const wl = await query(`SELECT setting_key FROM runtime_settings WHERE setting_key LIKE 'wl:%'`);
  const bl = await query(`SELECT setting_key FROM runtime_settings WHERE setting_key LIKE 'bl:%'`);
  return {
    wl: wl.map(r => r.setting_key.slice(3)),
    bl: bl.map(r => r.setting_key.slice(3)),
  };
}

export function startBot() {
  if (!config.telegramBotToken) {
    console.log("Telegram disabled (no token).");
    return;
  }
  bot = new Telegraf(config.telegramBotToken);

  bot.start((ctx) => {
    if (config.telegramChatId && String(ctx.chat.id) !== String(config.telegramChatId)) return;
    ctx.reply("नमस्ते! Trading Agent चालू है. /infocmd भेजें।");
  });

  bot.on("text", async (ctx) => {
    if (config.telegramChatId && String(ctx.chat.id) !== String(config.telegramChatId)) return;
    const text = (ctx.message.text || "").trim();
    const [cmd, ...rest] = text.split(/\s+/);
    const parts = [cmd, ...rest];

    if (cmd === "/infocmd") {
      await ctx.reply(
`*Commands (हिंदी):*
\`/status\` — WL/BL, risk, autoexec
\`/whitelist add BTCUSDT | /whitelist remove BTCUSDT | /whitelist list\`
\`/blacklist add BTCUSDT | /blacklist remove BTCUSDT | /blacklist list\`
\`/risk 0.5%\` | \`/risk BTCUSDT 0.25%\`
\`/autoexecute on|off\`
\`/tf list\` | \`/tf set HTF 1D\` | \`/tf set MTF 4H\` | \`/tf set LTF 1H\`
\`/tf preset scalper|swing|investor\`
`, { parse_mode: "Markdown" });
      return;
    }

    if (cmd === "/status") {
      const st = await query("SELECT setting_key, setting_value FROM runtime_settings");
      const map = Object.fromEntries(st.map(r => [r.setting_key, r.setting_value]));
      const { wl, bl } = await getWLBL();
      await ctx.reply(`⚙️ *Status*\nWL: ${wl.length} | BL: ${bl.length}\nRisk: ${map["risk:default"] || "n/a"} | AutoExec: ${map["autoexec"] || "off"}`, { parse_mode: "Markdown" });
      return;
    }

    if (cmd === "/whitelist" || cmd === "/blacklist") {
      const type = cmd === "/whitelist" ? "wl" : "bl";
      const sub = (parts[1] || "").toLowerCase();
      const sym = (parts[2] || "").toUpperCase();
      if (sub === "add" && sym) {
        await setSetting(`${type}:${sym}`, "1");
        await notify(`✅ ${type.toUpperCase()} add: *${sym}*`);
        return;
      }
      if (sub === "remove" && sym) {
        await query(`DELETE FROM runtime_settings WHERE setting_key=?`, [`${type}:${sym}`]);
        await notify(`🗑️ ${type.toUpperCase()} remove: *${sym}*`);
        return;
      }
      if (sub === "list") {
        const { wl, bl } = await getWLBL();
        await notify(`${type === "wl" ? "WL" : "BL"}: ${type === "wl" ? wl.join(", ") : bl.join(", ")}`);
        return;
      }
      await notify("ℹ️ उपयोग: /whitelist add BTCUSDT | /whitelist remove BTCUSDT | /whitelist list");
      return;
    }

    if (cmd === "/risk") {
      const a1 = (parts[1] || "").toUpperCase();
      const a2 = (parts[2] || "").toLowerCase();
      if (!a1) { await notify("ℹ️ उपयोग: /risk 0.5%  |  /risk BTCUSDT 0.25%"); return; }
      if (/^[A-Z0-9]+$/.test(a1) && a2) {
        const n = Number(a2.replace("%", "")); const f = (n > 1) ? n / 100 : n;
        await setSetting(`risk:${a1}`, String(f));
        await notify(`✅ Symbol risk (${a1}): *${(f * 100).toFixed(2)}%*`);
        return;
      }
      const n = Number(a1.replace("%", "")); const f = (n > 1) ? n / 100 : n;
      await setSetting("risk:default", String(f));
      await notify(`✅ Global risk: *${(f * 100).toFixed(2)}%*`);
      return;
    }

    if (cmd === "/autoexecute") {
      const v = (parts[1] || "").toLowerCase();
      if (!v) { await notify("ℹ️ उपयोग: /autoexecute on|off"); return; }
      await setSetting("autoexec", v === "on" ? "on" : "off");
      await notify(`✅ Auto-exec: *${v}*`);
      return;
    }

    if (cmd === "/tf") {
      const sub = (parts[1] || "").toLowerCase();
      if (!sub || sub === "list") {
        const h = await getSetting("TF_HTF", "1D");
        const m = await getSetting("TF_MTF", "4H");
        const l = await getSetting("TF_LTF", "1H");
        await notify(`🕒 *Active Timeframes*\nHTF: *${h}*\nMTF: *${m}*\nLTF: *${l}*`);
        return;
      }
      if (sub === "preset") {
        const p = (parts[2] || "").toLowerCase();
        if (p === "scalper") { await setSetting("TF_HTF", "4H"); await setSetting("TF_MTF", "1H"); await setSetting("TF_LTF", "15M"); await notify("✅ Preset *scalper*: HTF=4H, MTF=1H, LTF=15M"); return; }
        if (p === "swing")   { await setSetting("TF_HTF", "1D"); await setSetting("TF_MTF", "4H"); await setSetting("TF_LTF", "1H");  await notify("✅ Preset *swing*: HTF=1D, MTF=4H, LTF=1H");  return; }
        if (p === "investor"){ await setSetting("TF_HTF", "1W"); await setSetting("TF_MTF", "1D"); await setSetting("TF_LTF", "4H");  await notify("✅ Preset *investor*: HTF=1W, MTF=1D, LTF=4H"); return; }
        await notify("ℹ️ Presets: scalper | swing | investor");
        return;
      }
      if (sub === "set") {
        const role = (parts[2] || "").toUpperCase();
        const tf = (parts[3] || "").toUpperCase();
        if (!["HTF", "MTF", "LTF"].includes(role) || !tf) { await notify("ℹ️ उपयोग: /tf set HTF 1D | /tf set MTF 4H | /tf set LTF 1H"); return; }
        await setSetting("TF_" + role, tf);
        await notify(`✅ ${role} timeframe set: *${tf}*`);
        return;
      }
      await notify("ℹ️ उपयोग: /tf list | /tf set HTF 1D | /tf set MTF 4H | /tf set LTF 1H | /tf preset scalper|swing|investor");
      return;
    }
  });

  bot.launch();
  console.log("Telegram bot started.");
}

process.once("SIGINT", () => bot && bot.stop("SIGINT"));
process.once("SIGTERM", () => bot && bot.stop("SIGTERM"));
