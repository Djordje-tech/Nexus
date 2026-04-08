// ═══════════════════════════════════════════════════════════════
//  GET /api/market-data
//  Returns latest prices from the webhook store
//  Frontend polls this every 1-2 seconds
// ═══════════════════════════════════════════════════════════════

import { getLatestPrices, getWebhookLog } from "@/lib/market-store";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Never cache this

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get("debug");

  const data = getLatestPrices();

  if (debug === "true") {
    const log = getWebhookLog();
    return NextResponse.json({ ...data, webhookLog: log.slice(-10) });
  }

  return NextResponse.json(data);
}
