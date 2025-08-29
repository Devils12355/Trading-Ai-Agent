import { getSetting } from "../db.js";
import { sma, rsi, structureBias, confluenceGate } from "./indicators.js";
import { analyzeChartWithLLM } from "./smcict_llm.js";

/**
 * Active TF roles pick करता है (runtime settings से), वरना defaults:
 * HTF=1D, MTF=4H, LTF=1H
 */
export async function getActiveTFs() {
  const h = (await getSetting("TF_HTF")) || "1D";
  const m = (await getSetting("TF_MTF")) || "4H";
  const l = (await getSetting("TF_LTF")) || "1H";
  return { HTF: h, MTF: m, LTF: l };
}

/**
 * TODO: Production में इसे exchange REST kline fetcher से replace करना।
 * अभी synthetic closes return करता है ताकि indicators काम करें।
 */
async function fetchCloses(symbol, timeframe, n = 200) {
  // synthetic: हल्का uptrend + sine wiggle
  return Array.from({ length: n }, (_, i) => 100 + i * 0.02 + Math.sin(i / 9) * 1.8);
}

/**
 * Multi-TF confluence:
 * HTF (bias) -> MTF (setup + RSI sanity) -> LTF (trigger + MA alignment)
 */
export async function analyzeMultiTF({ symbol, prompt }) {
  const { HTF, MTF, LTF } = await getActiveTFs();

  // 1) HTF bias (LLM) + indicator bias must match
  const htf = await analyzeChartWithLLM({ symbol, timeframe: HTF, prompt, role: "HTF" });
  const hCloses = await fetchCloses(symbol, HTF, 200);
  const indiHTFbias = structureBias({ closes: hCloses });
  if (!confluenceGate({ biasLLM: htf.bias, biasIndi: indiHTFbias })) {
    return { approve: false, reason: `HTF (${HTF}) indicator mismatch (LLM: ${htf.bias}, IND: ${indiHTFbias})` };
  }

  // 2) MTF setup + RSI sanity (avoid extreme zones)
  const mtf = await analyzeChartWithLLM({ symbol, timeframe: MTF, prompt, role: "MTF" });
  if (mtf.bias && mtf.bias !== htf.bias) {
    return { approve: false, reason: `MTF (${MTF}) bias != HTF bias` };
  }
  const mCloses = await fetchCloses(symbol, MTF, 200);
  const mRsi = rsi(mCloses, 14);
  if (mRsi != null && (mRsi > 75 || mRsi < 25)) {
    return { approve: false, reason: `MTF (${MTF}) RSI extreme (${mRsi.toFixed(1)})` };
  }

  // 3) LTF trigger + MA(20/50) alignment with direction
  const ltf = await analyzeChartWithLLM({ symbol, timeframe: LTF, prompt, role: "LTF" });
  if (!ltf.trigger) {
    return { approve: false, reason: `LTF (${LTF}) trigger not found` };
  }
  const lCloses = await fetchCloses(symbol, LTF, 200);
  const lSma20 = sma(lCloses, 20),
    lSma50 = sma(lCloses, 50);
  const wantBull = (mtf.bias || htf.bias) === "bullish";
  if (lSma20 != null && lSma50 != null) {
    const aligned = wantBull ? lSma20 >= lSma50 : lSma20 <= lSma50;
    if (!aligned) {
      return { approve: false, reason: `LTF (${LTF}) MA alignment fail (SMA20 ${wantBull ? ">=" : "<="} SMA50)` };
    }
  }

  // Final levels (LTF preferred -> fallback MTF)
  const entry = Number(ltf.entry ?? mtf.entry);
  const sl = Number(ltf.sl ?? mtf.sl);
  const tp = Number(ltf.tp ?? mtf.tp);
  const rr = (Math.abs(tp - entry) / Math.abs(entry - sl)) || null;
  const rrOk = rr && rr >= 5;

  const side = wantBull ? "buy" : "sell";
  const tf_context = `${HTF}/${MTF}/${LTF}`;
  const execution_tf = MTF;

  return {
    approve: Boolean(rrOk && entry && sl && tp),
    reason: rrOk ? null : "RR must be >= 1:5",
    side,
    entry,
    sl,
    tp,
    rr,
    context: { HTF, MTF, LTF, htf, mtf, ltf, tf_context, execution_tf },
  };
}
