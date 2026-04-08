// ═══════════════════════════════════════════════════════════════
//  NEXUS — Market Data Store (in-memory, server-side)
//  Receives data from TradingView webhooks, serves to frontend
// ═══════════════════════════════════════════════════════════════

const marketStore = {
  // Latest prices keyed by symbol
  prices: {},
  // Last update timestamp
  lastUpdate: null,
  // History for sparklines (last 60 ticks per symbol)
  history: {},
  // Raw webhook log (last 100 messages)
  webhookLog: [],
};

export function updatePrice(symbol, price, change, changePercent, volume) {
  const upperSym = symbol.toUpperCase();

  marketStore.prices[upperSym] = {
    price: parseFloat(price),
    change: parseFloat(change || 0),
    changePercent: parseFloat(changePercent || 0),
    volume: parseFloat(volume || 0),
    timestamp: Date.now(),
  };

  // Maintain history for sparklines
  if (!marketStore.history[upperSym]) {
    marketStore.history[upperSym] = [];
  }
  marketStore.history[upperSym].push(parseFloat(price));
  if (marketStore.history[upperSym].length > 60) {
    marketStore.history[upperSym] = marketStore.history[upperSym].slice(-60);
  }

  marketStore.lastUpdate = Date.now();
}

export function getLatestPrices() {
  return {
    prices: marketStore.prices,
    history: marketStore.history,
    lastUpdate: marketStore.lastUpdate,
  };
}

export function logWebhook(payload) {
  marketStore.webhookLog.push({
    payload,
    receivedAt: Date.now(),
  });
  if (marketStore.webhookLog.length > 100) {
    marketStore.webhookLog = marketStore.webhookLog.slice(-100);
  }
}

export function getWebhookLog() {
  return marketStore.webhookLog;
}
