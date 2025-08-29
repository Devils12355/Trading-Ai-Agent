export default class ExchangeAdapter {
  constructor(cfg) { this.cfg = cfg; }
  async init() {}
  async placeBracket({ symbol, side, entry, tp, sl, qty }) {
    // TODO: production में real REST order placement wire करें
    return { entryId: `stub-${Date.now()}`, tpId: null, slId: null };
  }
  async getLastPrice(symbol) { return null; }
  async watchFills(cb) {}   // optional: WS fills
  async pollFunding(cb) {}  // optional: funding updates
}
