'use client'

import React, { useState, useEffect, useMemo } from 'react';

// CENTRALIZED TRADE METRIC CALCULATOR
const computeTradeMetrics = (trade: any, feeRate = 0.0005) => {
  const entry = parseFloat(trade.entryPrice) || 0;
  const exit = parseFloat(trade.exitPrice) || 0;
  const qty = parseFloat(trade.quantity) || 0;
  const sl = parseFloat(trade.stopLoss) || 0;

  const openFee = entry * qty * feeRate;
  const closeFee = exit * qty * feeRate;
  const totalFee = openFee + closeFee;

  const grossPnl = trade.direction === 'LONG'
    ? (exit - entry) * qty
    : (entry - exit) * qty;

  const netPnl = grossPnl - totalFee;

  let rMultiple = trade.rMultiple;
  if (!isNaN(sl) && sl > 0 && Math.abs(entry - sl) > 0) {
    const riskPerUnit = Math.abs(entry - sl);
    const rewardPerUnit = trade.direction === 'LONG' ? (exit - entry) : (entry - exit);
    rMultiple = parseFloat((rewardPerUnit / riskPerUnit).toFixed(2));
  }

  return {
    ...trade,
    entryPrice: entry,
    exitPrice: exit,
    quantity: qty,
    stopLoss: sl,
    openFee,
    closeFee,
    totalFee,
    grossPnl,
    pnl: netPnl,
    rMultiple,
    status: netPnl >= 0 ? 'WIN' : 'LOSS'
  };
};

const DEFAULT_MOCK_TRADES = [
  { id: '1', date: '2026-03-01', time: '09:35', symbol: 'TSLA', direction: 'LONG', entryPrice: 240, exitPrice: 262, quantity: 25, stopLoss: 235, setup: 'Breakout', mistake: 'None', tvLink: 'https://www.tradingview.com', notes: 'Clean breakout.' },
  { id: '2', date: '2026-03-02', time: '10:15', symbol: 'NVDA', direction: 'SHORT', entryPrice: 880, exitPrice: 854, quantity: 10, stopLoss: 890, setup: 'Liquidity Sweep', mistake: 'FOMO', tvLink: '', notes: 'Reversal hold.' }
];

const SETUP_OPTIONS = ['Breakout', 'VWAP Bounce', 'Order Block', 'Liquidity Sweep', 'Trend Continuation', 'Reversal', 'Range Play'];
const MISTAKE_OPTIONS = ['None', 'FOMO', 'Revenge Trading', 'Overleveraging', 'Early Exit', 'Moved Stop Loss', 'No Plan', 'Chasing'];

export default function TradeZellaPro() {
  const [startingCapital, setStartingCapital] = useState(25000);
  const [feePercentage, setFeePercentage] = useState(0.05);
  const [trades, setTrades] = useState(DEFAULT_MOCK_TRADES);
  
  const [activeTopTab, setActiveTopTab] = useState('dashboard');
  const [activeSideTab, setActiveSideTab] = useState('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);

  const feeRateDecimal = feePercentage / 100;
  const processedTrades = useMemo(() => trades.map(t => computeTradeMetrics(t, feeRateDecimal)), [trades, feeRateDecimal]);

  // Performance Statistics
  const stats = useMemo(() => {
    if (!processedTrades.length) {
      return { totalTrades: 0, netPnl: 0, winRate: 0, totalFees: 0, avgRR: 0, currentCapital: startingCapital, wins: 0, losses: 0, bestSetup: 'N/A' };
    }
    const totalTrades = processedTrades.length;
    const wins = processedTrades.filter(t => t.pnl > 0);
    const losses = processedTrades.filter(t => t.pnl < 0);
    const winRate = (wins.length / totalTrades) * 100;
    const netPnl = processedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const currentCapital = startingCapital + netPnl;
    const totalFees = processedTrades.reduce((sum, t) => sum + t.totalFee, 0);
    const validR = processedTrades.filter(t => t.rMultiple && !isNaN(t.rMultiple));
    const avgRR = validR.length ? validR.reduce((sum, t) => sum + t.rMultiple, 0) / validR.length : 0;

    const setupMap: any = {};
    processedTrades.forEach(t => { setupMap[t.setup] = (setupMap[t.setup] || 0) + t.pnl; });
    const bestSetup = Object.keys(setupMap).sort((a, b) => setupMap[b] - setupMap[a])[0] || 'N/A';

    return { totalTrades, netPnl, currentCapital, totalFees, winRate, avgRR, wins: wins.length, losses: losses.length, bestSetup };
  }, [processedTrades, startingCapital]);

  const handleSaveTrade = (tradeData: any) => {
    setTrades([{ ...tradeData, id: `trd-${Date.now()}` }, ...trades]);
    setIsAddModalOpen(false);
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
    setSelectedTrade(null);
  };

  return (
    <div className="flex flex-col h-screen bg-[#070312] text-purple-100 overflow-hidden font-sans">
      
      {/* TOP NAVIGATION BAR (MATCHING SCREENSHOT 2) */}
      <header className="h-16 bg-[#0c051a] border-b border-purple-900/40 px-4 lg:px-6 flex items-center justify-between z-30 shrink-0 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 flex items-center justify-center purple-glow">
              <span className="font-black text-slate-950 font-mono text-sm">TZ</span>
            </div>
            <span className="font-extrabold text-white tracking-wider font-mono text-sm hidden sm:inline">TRADEZELLA</span>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-[#070312] p-1 rounded-xl border border-purple-900/40 text-xs font-mono">
            {['dashboard', 'journal', 'calculator', 'analytics', 'community'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTopTab(tab)}
                className={`px-4 py-1.5 rounded-lg font-semibold transition-all capitalize ${
                  activeTopTab === tab
                    ? 'bg-gradient-to-r from-purple-600/40 to-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/30 purple-glow'
                    : 'text-purple-300/70 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 text-white font-bold text-xs px-4 py-2 rounded-xl purple-glow transition-all flex items-center gap-1.5 font-mono"
          >
            <span>+ Log Trade</span>
          </button>
          <div className="w-9 h-9 rounded-full bg-purple-900/50 border border-purple-700/50 flex items-center justify-center text-purple-200">
            <span>[U]</span>
          </div>
        </div>
      </header>

      {/* BODY LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SECONDARY SIDEBAR (ANALYTICS TOOLS) */}
        <aside className="w-56 bg-[#0a0416]/80 border-r border-purple-900/30 hidden lg:flex flex-col p-4 shrink-0 font-mono">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest px-3 mb-2">Analytics Tools</span>
          <div className="space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'calendar', label: 'Calendar', icon: '📅' },
              { id: 'strategies', label: 'Strategies', icon: '📈' },
              { id: 'calculator', label: 'Position Sizer', icon: '🧮' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSideTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSideTab === item.id
                    ? 'bg-purple-600/20 text-fuchsia-300 border border-fuchsia-500/30'
                    : 'text-purple-300/70 hover:text-white hover:bg-purple-900/20'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* CAPITAL & FEE CONTROLS WIDGET */}
          <div className="mt-auto bg-[#080314] p-3.5 rounded-2xl border border-purple-900/40 space-y-3">
            <div>
              <label className="text-[10px] text-purple-400 block mb-1">Starting Capital ($)</label>
              <input
                type="number"
                value={startingCapital}
                onChange={(e) => setStartingCapital(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#12082b] text-white text-xs p-2 rounded-lg border border-purple-800/60 focus:outline-none focus:border-fuchsia-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-purple-400 block mb-1">Execution Fee (%)</label>
              <input
                type="number"
                step="0.001"
                value={feePercentage}
                onChange={(e) => setFeePercentage(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#12082b] text-white text-xs p-2 rounded-lg border border-purple-800/60 focus:outline-none focus:border-fuchsia-500 font-mono"
              />
            </div>
            <div className="pt-2 border-t border-purple-900/40 text-[10px] text-fuchsia-300">
              1% Risk: <strong>${(stats.currentCapital * 0.01).toFixed(2)}</strong>
            </div>
          </div>
        </aside>

        {/* MAIN VIEW AREA */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          
          {/* DASHBOARD TAB */}
          {activeTopTab === 'dashboard' && activeSideTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT 2 COLUMNS */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* PORTFOLIO PERFORMANCE GRAPH */}
                <div className="bg-[#0e061d]/90 border border-purple-900/40 rounded-3xl p-5 shadow-xl purple-glow">
                  <div className="flex items-center justify-between mb-4 font-mono">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Portfolio Performance & Equity Curve</h3>
                    <span className={`text-xs font-bold ${stats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stats.netPnl >= 0 ? `+$${stats.netPnl.toFixed(2)}` : `-$${Math.abs(stats.netPnl).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="h-48 flex items-end justify-between gap-3 bg-[#070312] rounded-2xl border border-purple-900/30 p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent"></div>
                    {processedTrades.map((t, idx) => (
                      <div key={idx} className="flex-1 bg-gradient-to-t from-fuchsia-600 to-purple-400 rounded-t-lg transition-all hover:opacity-80" style={{ height: `${Math.max(30, Math.min(100, (t.pnl + 200) * 0.6))}%` }}></div>
                    ))}
                  </div>
                </div>

                {/* KEY METRICS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                  <div className="bg-[#0e061d]/90 border border-purple-900/40 p-4 rounded-2xl">
                    <span className="text-[10px] text-purple-400 uppercase">Account Equity</span>
                    <div className="text-lg font-bold text-emerald-400 mt-1">${stats.currentCapital.toFixed(2)}</div>
                  </div>
                  <div className="bg-[#0e061d]/90 border border-purple-900/40 p-4 rounded-2xl">
                    <span className="text-[10px] text-purple-400 uppercase">Win Rate</span>
                    <div className="text-lg font-bold text-white mt-1">{stats.winRate.toFixed(1)}%</div>
                  </div>
                  <div className="bg-[#0e061d]/90 border border-purple-900/40 p-4 rounded-2xl">
                    <span className="text-[10px] text-purple-400 uppercase">Total Trades</span>
                    <div className="text-lg font-bold text-white mt-1">{stats.totalTrades}</div>
                  </div>
                  <div className="bg-[#0e061d]/90 border border-purple-900/40 p-4 rounded-2xl">
                    <span className="text-[10px] text-purple-400 uppercase">Top Setup</span>
                    <div className="text-sm font-bold text-fuchsia-300 mt-1 truncate">{stats.bestSetup}</div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: RECENT TRADES */}
              <div className="bg-[#0e061d]/90 border border-purple-900/40 rounded-3xl p-5 shadow-xl flex flex-col font-mono">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Recent Executions</h3>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {processedTrades.map(trade => (
                    <div
                      key={trade.id}
                      onClick={() => setSelectedTrade(trade)}
                      className="bg-[#080314] border border-purple-900/40 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:border-fuchsia-500/50 transition-all text-xs"
                    >
                      <div>
                        <span className="font-bold text-white text-sm">{trade.symbol}</span>
                        <span className="text-[10px] text-purple-400 block">{trade.date}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`}
                        </span>
                        <span className="text-[10px] text-purple-400 block">{trade.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* JOURNAL TAB */}
          {activeTopTab === 'journal' && (
            <div className="bg-[#0e061d]/90 border border-purple-900/40 rounded-3xl p-6 shadow-xl overflow-x-auto font-mono">
              <h3 className="text-base font-bold text-white mb-4">Complete Trades Journal</h3>
              <table className="w-full text-left text-xs text-purple-200">
                <thead className="bg-[#070312] text-purple-400 uppercase tracking-wider border-b border-purple-900/40">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Symbol</th>
                    <th className="py-3 px-3">Side</th>
                    <th className="py-3 px-3">Entry / Exit</th>
                    <th className="py-3 px-3 text-right">Fee</th>
                    <th className="py-3 px-3 text-right">Net P&L</th>
                    <th className="py-3 px-3 text-center">TV Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20">
                  {processedTrades.map(t => (
                    <tr key={t.id} onClick={() => setSelectedTrade(t)} className="hover:bg-purple-900/20 cursor-pointer">
                      <td className="py-3 px-3 text-purple-400">{t.date}</td>
                      <td className="py-3 px-3 font-bold text-white">{t.symbol}</td>
                      <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{t.direction}</span></td>
                      <td className="py-3 px-3">${t.entryPrice} / ${t.exitPrice}</td>
                      <td className="py-3 px-3 text-right text-amber-400">${t.totalFee.toFixed(2)}</td>
                      <td className={`py-3 px-3 text-right font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{t.pnl >= 0 ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`}</td>
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        {t.tvLink ? <a href={t.tvLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline text-[10px]">Open Chart</a> : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* POSITION SIZER TAB */}
          {activeTopTab === 'calculator' && (
            <div className="max-w-xl mx-auto bg-[#0e061d] border border-purple-900/40 p-6 rounded-3xl shadow-xl font-mono space-y-4">
              <h3 className="text-sm font-bold text-white uppercase border-b border-purple-900/40 pb-3">Position Size Calculator</h3>
              <p className="text-xs text-purple-400">Calculate exact unit size based on your 1% risk rule.</p>
              <div className="p-4 bg-[#070312] rounded-2xl border border-purple-900/40 space-y-2 text-xs">
                <div className="flex justify-between"><span>Account Equity:</span> <strong className="text-emerald-400">${stats.currentCapital.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span>1% Risk Amount:</span> <strong className="text-fuchsia-300">${(stats.currentCapital * 0.01).toFixed(2)}</strong></div>
              </div>
            </div>
          )}

          {/* CALENDAR VIEW */}
          {activeSideTab === 'calendar' && (
            <div className="bg-[#0e061d]/90 border border-purple-900/40 rounded-3xl p-6 shadow-xl font-mono">
              <h3 className="text-base font-bold text-white mb-4">Performance Calendar</h3>
              <div className="grid grid-cols-7 gap-2 text-center text-xs text-purple-400">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-2">{d}</div>)}
                {Array.from({ length: 31 }).map((_, i) => (
                  <div key={i} className="h-20 bg-[#070312] border border-purple-900/30 rounded-xl p-2 flex flex-col justify-between">
                    <span className="text-[10px] text-purple-500">{i + 1}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">{i % 3 === 0 ? '+$120' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* LOG TRADE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#110726] border border-purple-800/60 rounded-3xl w-full max-w-md p-6 space-y-4 font-mono text-xs shadow-2xl purple-glow">
            <div className="flex justify-between items-center border-b border-purple-900/60 pb-3">
              <h3 className="font-bold text-white text-sm">LOG NEW TRADE</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-purple-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              handleSaveTrade({
                symbol: fd.get('symbol')?.toString().toUpperCase(),
                direction: fd.get('direction'),
                entryPrice: fd.get('entry'),
                exitPrice: fd.get('exit'),
                quantity: fd.get('qty'),
                stopLoss: fd.get('sl'),
                setup: fd.get('setup'),
                tvLink: fd.get('tvLink'),
                date: new Date().toISOString().slice(0, 10)
              });
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-purple-300 block mb-1">Symbol</label><input name="symbol" placeholder="AAPL" className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60 uppercase" required /></div>
                <div><label className="text-purple-300 block mb-1">Direction</label><select name="direction" className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60 font-bold"><option value="LONG">LONG</option><option value="SHORT">SHORT</option></select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-purple-300 block mb-1">Entry ($)</label><input name="entry" type="number" step="any" className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60" required /></div>
                <div><label className="text-purple-300 block mb-1">Exit ($)</label><input name="exit" type="number" step="any" className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60" required /></div>
                <div><label className="text-purple-300 block mb-1">Quantity</label><input name="qty" type="number" step="any" className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-purple-300 block mb-1">Stop Loss ($)</label><input name="sl" type="number" step="any" className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60" /></div>
                <div><label className="text-purple-300 block mb-1">Setup Tag</label><select name="setup" className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60">{SETUP_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="text-purple-300 block mb-1">TradingView Chart Link</label><input name="tvLink" type="url" placeholder="https://www.tradingview.com/chart/..." className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60 text-xs" /></div>
              <div className="flex justify-end gap-2 pt-2 border-t border-purple-900/60">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-purple-950 text-purple-200 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg">Save Trade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRADE DETAIL MODAL */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#110726] border border-purple-800/60 rounded-3xl w-full max-w-sm p-6 space-y-4 font-mono text-xs shadow-2xl purple-glow">
            <div className="flex justify-between items-center border-b border-purple-900/60 pb-3">
              <h3 className="font-bold text-white">{selectedTrade.symbol} ({selectedTrade.direction})</h3>
              <button onClick={() => setSelectedTrade(null)} className="text-purple-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Net P&L:</span> <strong className={selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${selectedTrade.pnl.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Fee Cut:</span> <strong className="text-amber-400">${selectedTrade.totalFee.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Setup:</span> <strong className="text-purple-200">{selectedTrade.setup}</strong></div>
              {selectedTrade.tvLink && (
                <div className="pt-2">
                  <a href={selectedTrade.tvLink} target="_blank" rel="noopener noreferrer" className="block text-center py-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">Open TradingView Chart</a>
                </div>
              )}
            </div>
            <div className="flex justify-between pt-3 border-t border-purple-900/60">
              <button onClick={() => handleDeleteTrade(selectedTrade.id)} className="px-3 py-1.5 bg-rose-500/10 text-rose-400 rounded-xl">Delete</button>
              <button onClick={() => setSelectedTrade(null)} className="px-4 py-1.5 bg-purple-600 text-white rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
