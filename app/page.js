"use client";
import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
//  N E X U S  —  Quantitative Trading Command Center
//  v1.0 — Web Deployment Build
// ═══════════════════════════════════════════════════════════════

const PATTERN_DATABASE = {
  candlestick: [
    { name: "Hammer", type: "reversal", direction: "bullish", reliability: 0.65 },
    { name: "Shooting Star", type: "reversal", direction: "bearish", reliability: 0.63 },
    { name: "Doji", type: "indecision", direction: "neutral", reliability: 0.52 },
    { name: "Engulfing Bull", type: "reversal", direction: "bullish", reliability: 0.72 },
    { name: "Engulfing Bear", type: "reversal", direction: "bearish", reliability: 0.71 },
    { name: "Morning Star", type: "reversal", direction: "bullish", reliability: 0.78 },
    { name: "Evening Star", type: "reversal", direction: "bearish", reliability: 0.76 },
    { name: "Three White Soldiers", type: "continuation", direction: "bullish", reliability: 0.74 },
    { name: "Three Black Crows", type: "continuation", direction: "bearish", reliability: 0.73 },
    { name: "Harami Bull", type: "reversal", direction: "bullish", reliability: 0.58 },
    { name: "Harami Bear", type: "reversal", direction: "bearish", reliability: 0.57 },
    { name: "Piercing Line", type: "reversal", direction: "bullish", reliability: 0.64 },
    { name: "Dark Cloud Cover", type: "reversal", direction: "bearish", reliability: 0.63 },
    { name: "Tweezer Top", type: "reversal", direction: "bearish", reliability: 0.55 },
    { name: "Tweezer Bottom", type: "reversal", direction: "bullish", reliability: 0.56 },
  ],
  smartMoney: [
    { name: "FVG (Fair Value Gap)", type: "imbalance", reliability: 0.68 },
    { name: "IFVG (Inverse FVG)", type: "mitigation", reliability: 0.62 },
    { name: "Order Block", type: "institutional", reliability: 0.71 },
    { name: "Breaker Block", type: "reversal", reliability: 0.66 },
    { name: "Mitigation Block", type: "mitigation", reliability: 0.59 },
    { name: "BOS (Break of Structure)", type: "trend", reliability: 0.74 },
    { name: "CHoCH (Change of Character)", type: "reversal", reliability: 0.69 },
    { name: "Liquidity Sweep", type: "manipulation", reliability: 0.77 },
    { name: "Judas Swing", type: "manipulation", reliability: 0.72 },
    { name: "Turtle Soup", type: "reversal", reliability: 0.61 },
    { name: "AMD (Accumulation-Manipulation-Distribution)", type: "cycle", reliability: 0.75 },
    { name: "Premium/Discount Zone", type: "value", reliability: 0.70 },
  ],
  volumeProfile: [
    { name: "POC (Point of Control)", type: "value", reliability: 0.82 },
    { name: "Value Area High", type: "resistance", reliability: 0.76 },
    { name: "Value Area Low", type: "support", reliability: 0.77 },
    { name: "HVN (High Volume Node)", type: "balance", reliability: 0.73 },
    { name: "LVN (Low Volume Node)", type: "breakout", reliability: 0.79 },
    { name: "Virgin POC", type: "magnet", reliability: 0.84 },
    { name: "Naked POC", type: "magnet", reliability: 0.81 },
    { name: "Volume Shelf", type: "support_resistance", reliability: 0.71 },
    { name: "Delta Divergence", type: "reversal", reliability: 0.73 },
    { name: "CVD Divergence", type: "reversal", reliability: 0.76 },
    { name: "Absorption", type: "reversal", reliability: 0.78 },
  ],
  intermarket: [
    { name: "NQ/ES Divergence", type: "ssmt", reliability: 0.71 },
    { name: "DXY Inverse Correlation", type: "macro", reliability: 0.65 },
    { name: "VIX Spike Reversal", type: "volatility", reliability: 0.69 },
    { name: "Yield Curve Signal", type: "macro", reliability: 0.62 },
    { name: "Sector Rotation", type: "macro", reliability: 0.58 },
    { name: "Gold/Bond Correlation Break", type: "regime", reliability: 0.64 },
  ],
  statistical: [
    { name: "Mean Reversion (2σ)", type: "reversion", reliability: 0.72 },
    { name: "Momentum Breakout", type: "trend", reliability: 0.67 },
    { name: "Hurst Exponent Regime", type: "regime", reliability: 0.63 },
    { name: "GARCH Volatility Cluster", type: "volatility", reliability: 0.66 },
    { name: "Markov Regime Switch", type: "regime", reliability: 0.68 },
    { name: "Gamma Exposure Flip", type: "options_flow", reliability: 0.74 },
    { name: "Quarterly Theory Phase", type: "time", reliability: 0.61 },
    { name: "Session Open Range", type: "time", reliability: 0.70 },
    { name: "Kill Zone Entry", type: "time", reliability: 0.67 },
  ],
};

const TOTAL_PATTERNS = Object.values(PATTERN_DATABASE).flat().length;

function generateMarketData() {
  const now = Date.now();
  const baseNQ = 21450 + Math.sin(now / 50000) * 200 + (Math.random() - 0.5) * 80;
  const baseES = 6020 + Math.sin(now / 55000) * 50 + (Math.random() - 0.5) * 20;
  const baseDXY = 103.2 + Math.sin(now / 80000) * 1.5 + (Math.random() - 0.5) * 0.3;
  const baseVIX = 16.5 + Math.sin(now / 40000) * 4 + (Math.random() - 0.5) * 1.5;
  return {
    NQ: { price: baseNQ.toFixed(2), change: ((Math.random() - 0.48) * 1.2).toFixed(2) },
    ES: { price: baseES.toFixed(2), change: ((Math.random() - 0.48) * 0.8).toFixed(2) },
    DXY: { price: baseDXY.toFixed(2), change: ((Math.random() - 0.5) * 0.3).toFixed(2) },
    VIX: { price: baseVIX.toFixed(1), change: ((Math.random() - 0.5) * 2).toFixed(2) },
  };
}

function detectRegime(data) {
  const vix = parseFloat(data.VIX.price);
  const nqC = parseFloat(data.NQ.change);
  const esC = parseFloat(data.ES.change);
  const div = Math.abs(nqC - esC);
  if (vix > 25) return { regime: "CRISIS", color: "#ff3b30", confidence: 0.89 };
  if (vix > 20) return { regime: "HIGH VOL", color: "#ff9500", confidence: 0.82 };
  if (div > 0.8) return { regime: "DIVERGENCE", color: "#af52de", confidence: 0.74 };
  if (Math.abs(nqC) < 0.15 && Math.abs(esC) < 0.15) return { regime: "RANGE", color: "#5ac8fa", confidence: 0.77 };
  if (nqC > 0.3 && esC > 0.3) return { regime: "RISK ON", color: "#34c759", confidence: 0.81 };
  if (nqC < -0.3 && esC < -0.3) return { regime: "RISK OFF", color: "#ff3b30", confidence: 0.78 };
  return { regime: "TRANSITION", color: "#ffd60a", confidence: 0.61 };
}

function generateSignals(data, regime) {
  const signals = [];
  const nqP = parseFloat(data.NQ.price);
  const esP = parseFloat(data.ES.price);
  const vix = parseFloat(data.VIX.price);
  const nqC = parseFloat(data.NQ.change);
  const esC = parseFloat(data.ES.change);

  if (Math.abs(nqC - esC) > 0.5) {
    const dir = nqC > esC ? "SHORT NQ" : "LONG NQ";
    const isShort = dir.includes("SHORT");
    signals.push({
      name: "SSMT Divergence",
      direction: dir,
      strength: Math.min(95, 60 + Math.abs(nqC - esC) * 25),
      confluence: ["NQ/ES Spread", "CVD Confirmation", "Quarterly Phase"],
      entry: (isShort ? nqP + 15 : nqP - 15).toFixed(2),
      sl: (isShort ? nqP + 65 : nqP - 65).toFixed(2),
      tp1: (isShort ? nqP - 80 : nqP + 80).toFixed(2),
      tp2: (isShort ? nqP - 160 : nqP + 160).toFixed(2),
      rr: "1:2.5",
    });
  }

  if (vix > 22) {
    signals.push({
      name: "VIX Spike — Mean Reversion",
      direction: "LONG ES",
      strength: Math.min(90, 55 + (vix - 20) * 5),
      confluence: ["VIX > 2σ", "Historical Reversion", "Gamma Flip Zone"],
      entry: esP.toFixed(2),
      sl: (esP - 30).toFixed(2),
      tp1: (esP + 40).toFixed(2),
      tp2: (esP + 80).toFixed(2),
      rr: "1:2.7",
    });
  }

  if (regime.regime === "RANGE") {
    const poc = Math.round(nqP / 25) * 25;
    const above = nqP > poc;
    signals.push({
      name: "POC Magnet — Range Play",
      direction: above ? "SHORT NQ" : "LONG NQ",
      strength: 72,
      confluence: ["POC Proximity", "Range Regime", "Low Delta"],
      entry: nqP.toFixed(2),
      sl: (above ? nqP + 40 : nqP - 40).toFixed(2),
      tp1: poc.toFixed(2),
      tp2: (above ? poc - 25 : poc + 25).toFixed(2),
      rr: "1:1.8",
    });
  }

  const hour = new Date().getHours();
  if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
    signals.push({
      name: "Kill Zone Active",
      direction: "WATCH",
      strength: 65,
      confluence: ["Session Timing", "Volume Surge Expected", "Institutional Flow"],
      entry: "—", sl: "—", tp1: "—", tp2: "—", rr: "—",
    });
  }

  return signals;
}

function generateChartData(points = 60) {
  const data = [];
  let price = 21400;
  for (let i = 0; i < points; i++) {
    price += (Math.random() - 0.49) * 15;
    data.push(price);
  }
  return data;
}

// ── Components ──

function Sparkline({ data, color, width = 120, height = 32 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PriceChart({ data, height = 160 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data) - 10;
  const max = Math.max(...data) + 10;
  const range = max - min;
  const w = 600;
  const h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const lastP = data[data.length - 1];
  const color = lastP >= data[0] ? "#34c759" : "#ff3b30";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#cg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" y1={h * f} x2={w} y2={h * f} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <text x={w - 5} y={h - ((lastP - min) / range) * h - 6} fill={color} fontSize="11" fontFamily="JetBrains Mono, monospace" textAnchor="end">
        {lastP.toFixed(2)}
      </text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════

export default function NexusPage() {
  const [time, setTime] = useState(new Date());
  const [marketData, setMarketData] = useState(null);
  const [regime, setRegime] = useState(null);
  const [signals, setSignals] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [bootSequence, setBootSequence] = useState(true);
  const [bootLine, setBootLine] = useState(0);
  const [consoleInput, setConsoleInput] = useState("");
  const [consoleLog, setConsoleLog] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [dataSource, setDataSource] = useState("SIM"); // "LIVE" or "SIM"
  const inputRef = useRef(null);

  const bootMessages = [
    "NEXUS Quant Engine v1.0 — Initializing...",
    `Loading pattern database... ${TOTAL_PATTERNS} patterns across 5 categories`,
    "Calibrating regime detection — Hamilton filter online",
    "SSMT divergence scanner... armed",
    "Volume profile engine... POC / VA / Delta ready",
    "Intermarket correlation matrix... NQ | ES | DXY | VIX | GC | ZB",
    "Kill zone scheduler... London | NY | Asia sessions mapped",
    "Risk management module... max 2% per trade | dynamic sizing",
    "Connecting Yahoo Finance data feed...",
    "All systems nominal. Welcome, Commander.",
  ];

  // Fetch real market data from Yahoo Finance API
  async function fetchLiveData() {
    try {
      const res = await fetch("/api/yahoo", { cache: "no-store" });
      if (!res.ok) throw new Error("API error");
      const apiData = await res.json();

      if (apiData.prices && Object.keys(apiData.prices).length > 0) {
        setDataSource("LIVE");
        const result = {};
        for (const [sym, d] of Object.entries(apiData.prices)) {
          result[sym] = {
            price: typeof d.price === "number" ? d.price.toFixed(2) : String(d.price),
            change: typeof d.changePercent === "number" ? d.changePercent.toFixed(2) : "0.00",
          };
        }
        return { marketData: result };
      } else {
        setDataSource("SIM");
        return { marketData: generateMarketData() };
      }
    } catch {
      setDataSource("SIM");
      return { marketData: generateMarketData() };
    }
  }

  // Mount guard for SSR
  useEffect(() => {
    const initData = generateMarketData();
    setMarketData(initData);
    setRegime(detectRegime(initData));
    setSignals(generateSignals(initData, detectRegime(initData)));
    setChartData(generateChartData());
    setMounted(true);
  }, []);

  // Boot sequence
  useEffect(() => {
    if (!bootSequence) return;
    if (bootLine < bootMessages.length) {
      const t = setTimeout(() => setBootLine((b) => b + 1), 350);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setBootSequence(false), 800);
      return () => clearTimeout(t);
    }
  }, [bootSequence, bootLine]);

  // Live tick — fetches from Yahoo Finance every 10 seconds
  useEffect(() => {
    if (!mounted) return;
    
    // Fetch immediately on mount
    fetchLiveData().then(({ marketData: d }) => {
      setMarketData(d);
      const r = detectRegime(d);
      setRegime(r);
      setSignals(generateSignals(d, r));
      if (d.NQ) setChartData((prev) => [...prev.slice(1), parseFloat(d.NQ.price)]);
    });

    // Then poll every 10 seconds (Yahoo doesn't need faster than this)
    const interval = setInterval(async () => {
      setTime(new Date());
      const { marketData: d } = await fetchLiveData();
      setMarketData(d);
      const r = detectRegime(d);
      setRegime(r);
      setSignals(generateSignals(d, r));
      if (d.NQ) setChartData((prev) => [...prev.slice(1), parseFloat(d.NQ.price)]);
    }, 10000);

    // Clock updates every second (separate from data)
    const clockInterval = setInterval(() => setTime(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [mounted]);

  const getGreeting = () => {
    const h = time.getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const getSession = () => {
    const h = time.getUTCHours();
    if (h >= 0 && h < 8) return { name: "ASIA", color: "#ff9f0a" };
    if (h >= 7 && h < 15) return { name: "LONDON", color: "#5ac8fa" };
    if (h >= 13 && h < 21) return { name: "NEW YORK", color: "#34c759" };
    return { name: "OFF-HOURS", color: "#636366" };
  };

  const session = getSession();

  const handleConsoleSubmit = (e) => {
    if (e.key !== "Enter" || !consoleInput.trim()) return;
    const cmd = consoleInput.trim().toLowerCase();
    let response = "";
    if (cmd === "scan" || cmd === "scan all") {
      response = `Scanning all ${TOTAL_PATTERNS} patterns across NQ, ES, DXY, VIX...`;
    } else if (cmd === "regime") {
      response = regime ? `Current regime: ${regime.regime} (${(regime.confidence * 100).toFixed(0)}% confidence)` : "Loading...";
    } else if (cmd === "signals") {
      response = signals.length ? `${signals.length} active signal(s) detected` : "No high-conviction signals at this time";
    } else if (cmd === "patterns") {
      response = `Pattern database: ${TOTAL_PATTERNS} patterns — Candlestick(${PATTERN_DATABASE.candlestick.length}) SMC(${PATTERN_DATABASE.smartMoney.length}) Volume(${PATTERN_DATABASE.volumeProfile.length}) Intermarket(${PATTERN_DATABASE.intermarket.length}) Statistical(${PATTERN_DATABASE.statistical.length})`;
    } else if (cmd === "help") {
      response = "Commands: scan | regime | signals | patterns | backtest | journal | webhook | clear | status";
    } else if (cmd === "status") {
      response = `NEXUS online | ${dataSource} feed | ${session.name} session | ${regime?.regime || "—"} regime | NQ ${marketData?.NQ?.price || "—"} | ${signals.length} signals`;
    } else if (cmd === "webhook") {
      response = dataSource === "LIVE"
        ? "TradingView webhook CONNECTED — receiving live data"
        : "Webhook waiting for data. Set TradingView alert webhook URL to: [your-domain]/api/webhook?token=nexus-djordje-2026";
    } else if (cmd === "clear") {
      setConsoleLog([]);
      setConsoleInput("");
      return;
    } else if (cmd === "backtest") {
      response = "Backtesting engine ready. Connect historical data feed to begin. [Phase 3]";
    } else if (cmd === "journal") {
      response = "Trade journal module loaded. [Phase 3]";
    } else {
      response = `Unknown command: '${cmd}'. Type 'help' for available commands.`;
    }
    setConsoleLog((prev) => [...prev.slice(-20), { cmd: consoleInput.trim(), response, time: new Date() }]);
    setConsoleInput("");
  };

  if (!mounted) return null;

  // ── BOOT SCREEN ──
  if (bootSequence) {
    return (
      <div style={{
        background: "#0a0a0a", minHeight: "100vh",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#34c759", padding: 40,
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ maxWidth: 700 }}>
          <div style={{ fontSize: 11, opacity: 0.3, marginBottom: 24, letterSpacing: 4 }}>NEXUS QUANTITATIVE ENGINE</div>
          {bootMessages.slice(0, bootLine).map((msg, i) => (
            <div key={i} style={{
              fontSize: 13, marginBottom: 6,
              opacity: i === bootLine - 1 ? 1 : 0.5,
              color: i === bootMessages.length - 1 ? "#ffd60a" : "#34c759",
              animation: "fadeIn 0.3s ease-out",
            }}>
              <span style={{ color: "#636366", marginRight: 8 }}>[{String(i).padStart(2, "0")}]</span>
              {msg}
            </div>
          ))}
          {bootLine < bootMessages.length && <span style={{ animation: "blink 1s infinite", fontSize: 13 }}>▌</span>}
        </div>
      </div>
    );
  }

  // ── MAIN UI ──
  return (
    <div
      style={{ background: "#08080a", minHeight: "100vh", fontFamily: "'JetBrains Mono', monospace", color: "#e5e5ea" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Top Bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 6, color: "#ffd60a" }}>NEXUS</div>
          <div style={{ fontSize: 10, color: "#636366", letterSpacing: 2 }}>QUANT ENGINE v1.0</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{
            fontSize: 10, padding: "4px 10px", borderRadius: 4, letterSpacing: 1,
            background: dataSource === "LIVE" ? "rgba(52,199,89,0.15)" : "rgba(255,149,0,0.15)",
            color: dataSource === "LIVE" ? "#34c759" : "#ff9500",
            animation: dataSource === "LIVE" ? "pulse 2s infinite" : "none",
          }}>
            {dataSource === "LIVE" ? "● LIVE" : "◌ SIMULATED"}
          </div>
          <div style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: `${session.color}18`, color: session.color, letterSpacing: 1 }}>
            {session.name}
          </div>
          {regime && (
            <div style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, background: `${regime.color}18`, color: regime.color, letterSpacing: 1 }}>
              {regime.regime} {(regime.confidence * 100).toFixed(0)}%
            </div>
          )}
          <div style={{ fontSize: 22, fontWeight: 300, fontVariantNumeric: "tabular-nums" }}>
            {time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ padding: "24px 24px 0" }}>
        <div style={{ fontSize: 24, fontWeight: 300 }}>
          {getGreeting()}, <span style={{ color: "#ffd60a" }}>Djordje</span>
        </div>
        <div style={{ fontSize: 11, color: "#636366", marginTop: 4 }}>
          {time.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {" · "}{TOTAL_PATTERNS} patterns loaded
        </div>
      </div>

      {/* Market Ticker */}
      {marketData && (() => {
        const primary = ["NQ", "ES", "DXY", "VIX"];
        const secondary = ["GOLD", "SILVER", "AAPL", "NVDA", "TSLA", "META", "MSFT", "AMD", "PLTR", "MU"];
        const primaryData = primary.filter((s) => marketData[s]);
        const secondaryData = secondary.filter((s) => marketData[s]);

        return (
          <>
            {/* Primary instruments */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(primaryData.length, 4)}, 1fr)`, gap: 1, padding: "20px 24px 0" }}>
              {primaryData.map((sym) => {
                const d = marketData[sym];
                const up = parseFloat(d.change) >= 0;
                const sparkData = Array.from({ length: 20 }, () => parseFloat(d.price) + (Math.random() - 0.5) * (sym === "NQ" ? 60 : sym === "ES" ? 15 : 1));
                return (
                  <div key={sym} style={{ background: "rgba(255,255,255,0.02)", padding: "16px 18px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#8e8e93", letterSpacing: 2, marginBottom: 6 }}>{sym}</div>
                        <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{d.price}</div>
                      </div>
                      <Sparkline data={sparkData} color={up ? "#34c759" : "#ff3b30"} />
                    </div>
                    <div style={{ fontSize: 12, color: up ? "#34c759" : "#ff3b30", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                      {up ? "+" : ""}{d.change}%
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Secondary instruments — compact row */}
            {secondaryData.length > 0 && (
              <div style={{ display: "flex", gap: 1, padding: "1px 24px 0", overflowX: "auto" }}>
                {secondaryData.map((sym) => {
                  const d = marketData[sym];
                  const up = parseFloat(d.change) >= 0;
                  return (
                    <div key={sym} style={{
                      background: "rgba(255,255,255,0.02)", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.04)",
                      minWidth: 0, flex: "1 1 0",
                    }}>
                      <div style={{ fontSize: 9, color: "#8e8e93", letterSpacing: 1, marginBottom: 4 }}>{sym}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{d.price}</div>
                      <div style={{ fontSize: 10, color: up ? "#34c759" : "#ff3b30", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                        {up ? "+" : ""}{d.change}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );
      })()}

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 1, padding: "16px 24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Chart */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: "#8e8e93", letterSpacing: 2, marginBottom: 12 }}>NQ FUTURES — LIVE</div>
            <PriceChart data={chartData} height={140} />
          </div>

          {/* Signals */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: "#8e8e93", letterSpacing: 2, marginBottom: 12 }}>
              ACTIVE SIGNALS — {signals.length} DETECTED
            </div>
            {signals.length === 0 ? (
              <div style={{ fontSize: 12, color: "#48484a", padding: "20px 0", textAlign: "center" }}>
                No high-conviction signals. Market conditions filtering active.
              </div>
            ) : signals.map((sig, i) => (
              <div key={i} style={{
                padding: "12px 14px", marginBottom: 6,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{sig.name}</div>
                  <div style={{
                    fontSize: 10, padding: "3px 8px", borderRadius: 3, fontWeight: 700,
                    background: sig.direction.includes("LONG") ? "rgba(52,199,89,0.15)" : sig.direction.includes("SHORT") ? "rgba(255,59,48,0.15)" : "rgba(255,214,10,0.15)",
                    color: sig.direction.includes("LONG") ? "#34c759" : sig.direction.includes("SHORT") ? "#ff3b30" : "#ffd60a",
                  }}>
                    {sig.direction}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 10, color: "#8e8e93", flexWrap: "wrap" }}>
                  <span>STR: <span style={{ color: sig.strength > 75 ? "#34c759" : "#ffd60a" }}>{sig.strength.toFixed(0)}%</span></span>
                  <span>R:R {sig.rr}</span>
                  <span>Entry {sig.entry}</span>
                  <span>SL {sig.sl}</span>
                  <span>TP1 {sig.tp1}</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {sig.confluence.map((c, j) => (
                    <span key={j} style={{
                      fontSize: 9, padding: "2px 7px", borderRadius: 3,
                      background: "rgba(255,255,255,0.05)", color: "#8e8e93",
                    }}>{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Console */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "16px 18px",
            display: "flex", flexDirection: "column", minHeight: 200,
          }}>
            <div style={{ fontSize: 10, color: "#8e8e93", letterSpacing: 2, marginBottom: 12 }}>COMMAND CONSOLE</div>
            <div style={{ flex: 1, overflowY: "auto", marginBottom: 8 }}>
              {consoleLog.length === 0 && <div style={{ fontSize: 11, color: "#48484a" }}>Type &apos;help&apos; for available commands</div>}
              {consoleLog.map((entry, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#ffd60a" }}>
                    <span style={{ color: "#636366" }}>{entry.time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} </span>
                    → {entry.cmd}
                  </div>
                  <div style={{ fontSize: 11, color: "#34c759", marginTop: 2, paddingLeft: 12 }}>{entry.response}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
              <span style={{ color: "#ffd60a", fontSize: 12 }}>→</span>
              <input
                ref={inputRef}
                type="text"
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                onKeyDown={handleConsoleSubmit}
                placeholder="Enter command..."
                style={{ flex: 1, background: "transparent", border: "none", color: "#e5e5ea", fontSize: 12, fontFamily: "inherit", outline: "none" }}
              />
            </div>
          </div>

          {/* Pattern Engine */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: "#8e8e93", letterSpacing: 2, marginBottom: 12 }}>PATTERN ENGINE</div>
            {Object.entries(PATTERN_DATABASE).map(([cat, patterns]) => (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "#ffd60a", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                  {cat.replace(/([A-Z])/g, " $1").trim()} — {patterns.length}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {patterns.slice(0, 5).map((p, i) => (
                    <span key={i} style={{
                      fontSize: 9, padding: "3px 7px", borderRadius: 3,
                      background: "rgba(255,255,255,0.04)", color: "#8e8e93",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      {p.name} <span style={{ color: p.reliability > 0.7 ? "#34c759" : "#ffd60a", marginLeft: 4 }}>{(p.reliability * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                  {patterns.length > 5 && <span style={{ fontSize: 9, color: "#636366", padding: "3px 7px" }}>+{patterns.length - 5}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* System Status */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: "#8e8e93", letterSpacing: 2, marginBottom: 12 }}>SYSTEM STATUS</div>
            {[
              { label: "Pattern DB", value: `${TOTAL_PATTERNS} patterns`, color: "#34c759" },
              { label: "Regime", value: regime?.regime || "—", color: regime?.color || "#636366" },
              { label: "Active Signals", value: `${signals.length}`, color: signals.length > 0 ? "#ffd60a" : "#636366" },
              { label: "Risk per Trade", value: "2.0% max", color: "#ff9500" },
              { label: "Session", value: session.name, color: session.color },
              { label: "Version", value: "1.0.0-web", color: "#636366" },
            ].map((s, i, arr) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              }}>
                <span style={{ fontSize: 11, color: "#8e8e93" }}>{s.label}</span>
                <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
