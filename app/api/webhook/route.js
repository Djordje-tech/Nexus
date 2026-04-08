// ═══════════════════════════════════════════════════════════════
//  POST /api/webhook
//  Receives TradingView alert webhooks
//
//  TradingView Alert Message format (set this in your alert):
//  {
//    "symbol": "{{ticker}}",
//    "price": "{{close}}",
//    "change": "{{change}}",
//    "changePercent": "{{changePercent}}",  
//    "volume": "{{volume}}",
//    "time": "{{time}}",
//    "exchange": "{{exchange}}",
//    "interval": "{{interval}}"
//  }
//
//  Or simplified:
//  {"symbol":"NQ1!","price":"{{close}}","change":"{{change}}","changePercent":"{{changePercent}}"}
// ═══════════════════════════════════════════════════════════════

import { updatePrice, logWebhook } from "@/lib/market-store";
import { NextResponse } from "next/server";

// Simple auth token — set this in your TradingView webhook URL:
// https://your-nexus.vercel.app/api/webhook?token=YOUR_SECRET
const WEBHOOK_TOKEN = process.env.NEXUS_WEBHOOK_TOKEN || "nexus-djordje-2026";

export async function POST(request) {
  try {
    // Auth check
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (token !== WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body — TradingView sends JSON or plain text
    let data;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const text = await request.text();
      try {
        data = JSON.parse(text);
      } catch {
        // If it's not JSON, try to parse as key=value pairs
        data = { raw: text };
      }
    }

    // Log it
    logWebhook(data);

    // Process the data
    if (data.symbol && data.price) {
      // Clean symbol name: "NQ1!" → "NQ", "XAUUSD" → "GOLD", etc.
      const symbolMap = {
        "NQ1!": "NQ",
        "NQH2026": "NQ",
        "ES1!": "ES",
        "ESH2026": "ES",
        "XAUUSD": "GOLD",
        "XAGUSD": "SILVER",
        "DXY": "DXY",
        "DX1!": "DXY",
        "US30": "US30",
        "YM1!": "US30",
        "SPX": "SPX",
        "SPX500USD": "SPX",
        "AAPL": "AAPL",
        "NVDA": "NVDA",
        "TSLA": "TSLA",
        "META": "META",
        "MSFT": "MSFT",
        "AMD": "AMD",
        "PLTR": "PLTR",
        "MU": "MU",
        "ITA": "ITA",
        "VIX": "VIX",
        "VX1!": "VIX",
      };

      const cleanSymbol = symbolMap[data.symbol] || data.symbol.replace(/[0-9!]/g, "");

      updatePrice(
        cleanSymbol,
        data.price,
        data.change || 0,
        data.changePercent || data.change_percent || 0,
        data.volume || 0
      );

      return NextResponse.json({
        status: "ok",
        symbol: cleanSymbol,
        price: data.price,
        timestamp: Date.now(),
      });
    }

    // Batch update — multiple symbols in one webhook
    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (item.symbol && item.price) {
          updatePrice(item.symbol, item.price, item.change || 0, item.changePercent || 0, item.volume || 0);
        }
      });
      return NextResponse.json({ status: "ok", count: data.length });
    }

    return NextResponse.json({ status: "received", note: "No symbol/price found in payload" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET — health check / debug
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (token !== WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "NEXUS webhook endpoint active",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
}
