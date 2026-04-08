// ═══════════════════════════════════════════════════════════════
//  GET /api/yahoo
//  Fetches real-time(ish) market data from Yahoo Finance
//  No API key needed — free, ~15min delayed for stocks
//  Futures/forex are near real-time
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";

// Yahoo Finance symbol mapping
const SYMBOLS = {
  // Futures
  NQ: "NQ=F",
  ES: "ES=F",
  YM: "YM=F",
  // Indices
  SPX: "^GSPC",
  NDX: "^NDX",
  DJI: "^DJI",
  // Volatility
  VIX: "^VIX",
  // Currencies
  DXY: "DX-Y.NYB",
  // Commodities
  GOLD: "GC=F",
  SILVER: "SI=F",
  OIL: "CL=F",
  // Stocks
  AAPL: "AAPL",
  NVDA: "NVDA",
  TSLA: "TSLA",
  META: "META",
  MSFT: "MSFT",
  AMD: "AMD",
  PLTR: "PLTR",
  MU: "MU",
  GOOGL: "GOOGL",
  AMZN: "AMZN",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchYahooQuotes(symbols) {
  const yahooSymbols = symbols.join(",");
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume,shortName,marketState`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    // Fallback to v6 endpoint
    const fallbackUrl = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${encodeURIComponent(yahooSymbols)}`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!fallbackRes.ok) throw new Error(`Yahoo API error: ${fallbackRes.status}`);
    return fallbackRes.json();
  }

  return res.json();
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // Allow requesting specific symbols, or default to core set
  const requestedSymbols = searchParams.get("symbols");
  let symbolKeys;

  if (requestedSymbols) {
    symbolKeys = requestedSymbols.split(",").map((s) => s.trim().toUpperCase());
  } else {
    // Default: core trading instruments
    symbolKeys = ["NQ", "ES", "DXY", "VIX", "GOLD", "SILVER", "AAPL", "NVDA", "TSLA", "META", "MSFT", "AMD", "PLTR", "MU"];
  }

  // Map to Yahoo symbols
  const yahooSymbols = symbolKeys
    .map((key) => SYMBOLS[key] || key)
    .filter(Boolean);

  try {
    const data = await fetchYahooQuotes(yahooSymbols);
    const quotes = data?.quoteResponse?.result || [];

    // Build reverse map: Yahoo symbol → our clean name
    const reverseMap = {};
    for (const [clean, yahoo] of Object.entries(SYMBOLS)) {
      reverseMap[yahoo] = clean;
    }

    // Format response
    const prices = {};
    const formattedQuotes = [];

    for (const q of quotes) {
      const cleanName = reverseMap[q.symbol] || q.symbol;
      const price = q.regularMarketPrice ?? 0;
      const change = q.regularMarketChange ?? 0;
      const changePercent = q.regularMarketChangePercent ?? 0;
      const volume = q.regularMarketVolume ?? 0;

      prices[cleanName] = {
        price,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume,
        name: q.shortName || cleanName,
        marketState: q.marketState || "CLOSED",
        symbol: q.symbol,
        timestamp: Date.now(),
      };

      formattedQuotes.push({
        symbol: cleanName,
        yahooSymbol: q.symbol,
        price,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        volume,
      });
    }

    return NextResponse.json({
      prices,
      quotes: formattedQuotes,
      source: "yahoo",
      fetchedAt: Date.now(),
      count: quotes.length,
    });
  } catch (error) {
    console.error("Yahoo Finance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data", message: error.message },
      { status: 502 }
    );
  }
}
