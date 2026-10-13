'use client'

import React, { useState, useMemo } from 'react';

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
  { id: '2', date: '2026-03-02', time: '10:15', symbol: 'NVDA', direction: 'SHORT', entryPrice: 880, exitPrice: 854, quantity: 10, stopLoss: 890, setup: 'Liquidity Sweep', mistake: 'FOMO', tvLink: '', notes: 'Reversal hold.' },
  { id: '3', date: '2026-03-03', time: '11:00', symbol: 'BTCUSDT', direction: 'LONG', entryPrice: 65400, exitPrice: 67800, quantity: 0.8, stopLoss: 64200, setup: 'VWAP Bounce', mistake: 'None', tvLink: '', notes: 'VWAP volume delta spike.' }
];

const SETUP_OPTIONS = ['Breakout', 'VWAP Bounce', 'Order Block', 'Liquidity Sweep', 'Trend Continuation', 'Reversal', 'Range Play'];
const MISTAKE_OPTIONS = ['None', 'FOMO', 'Revenge Trading', 'Overleveraging', 'Early Exit', 'Moved Stop Loss', 'No Plan', 'Chasing'];

export default function TradeZellaPro() {
  const [startingCapital, setStartingCapital] = useState(25000);
  const [feePercentage, setFeePercentage] = useState(0.05);
  const [trades, setTrades] = useState(DEFAULT_MOCK_TRADES);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<string | null>('trader@tradezella.pro');
  const [selectedTrade, setSelectedTrade] = useState<any>(null);

  // Position Sizer calculator state
  const [calcSymbol, setCalcSymbol] = useState('TSLA');
  const [calcRiskPct, setCalcRiskPct] = useState(1);
  const [calcEntry, setCalcEntry] = useState(250);
  const [calcSl, setCalcSl] = useState(245);

  const feeRateDecimal = feePercentage / 100;
  const processedTrades = useMemo(() => trades.map(t => computeTradeMetrics(t, feeRateDecimal)), [trades, feeRateDecimal]);

  // Performance Statistics & Strategy Breakdown
  const stats = useMemo(() => {
    if (!processedTrades.length) {
      return { totalTrades: 0, netPnl: 0, winRate: 0, totalFees: 0, avgRR: 0, currentCapital: startingCapital, winsCount: 0, lossesCount: 0, bestSetup: 'N/A' };
    }
    const totalTrades = processedTrades.length;
    const wins = processedTrades.filter(t => t.pnl > 0);
    const losses = processedTrades.filter(t => t.pnl < 0);
    const winsCount = wins.length;
    const lossesCount = losses.length;
    const winRate = totalTrades ? (winsCount / totalTrades) * 100 : 0;
    const netPnl = processedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const currentCapital = startingCapital + netPnl;
    const totalFees = processedTrades.reduce((sum, t) => sum + t.totalFee, 0);
    const validR = processedTrades.filter(t => t.rMultiple && !isNaN(t.rMultiple));
    const avgRR = validR.length ? validR.reduce((sum, t) => sum + t.rMultiple, 0) / validR.length : 0;

    const setupMap: any = {};
    processedTrades.forEach(t => {
      if (!setupMap[t.setup]) setupMap[t.setup] = { count: 0, wins: 0, pnl: 0 };
      setupMap[t.setup].count += 1;
      setupMap[t.setup].pnl += t.pnl;
      if (t.pnl > 0) setupMap[t.setup].wins += 1;
    });

    const bestSetup = Object.keys(setupMap).sort((a, b) => setupMap[b].pnl - setupMap[a].pnl)[0] || 'N/A';

    return { totalTrades, netPnl, currentCapital, totalFees, winRate, avgRR, winsCount, lossesCount, bestSetup, setupMap };
  }, [processedTrades, startingCapital]);

  const handleSaveTrade = (tradeData: any) => {
    setTrades([{ ...tradeData, id: `trd-${Date.now()}` }, ...trades]);
    setIsAddModalOpen(false);
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
    setSelectedTrade(null);
  };

  // Cumulative data for Modern SVG Line Visualizer
  const cumulativeData = useMemo(() => {
    let running = startingCapital;
    return processedTrades.map(t => {
      running += t.pnl;
      return running;
    });
  }, [processedTrades, startingCapital]);

  return (
    <div className="flex flex-col h-screen bg-[#070312] text-purple-100 overflow-hidden font-sans">
      
      {/* CLEAN TOP NAVBAR */}
      <header className="h-16 bg-[#0c051a] border-b border-purple-900/40 px-6 flex items-center justify-between z-30 shrink-0 shadow-2xl">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 flex items-center justify-center purple-glow">
            <span className="font-black text-slate-950 font-mono text-sm">TZ</span>
          </div>
          <span className="font-extrabold text-white tracking-wider font-mono text-sm">TRADEZELLA <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-300 px-1.5 py-0.5 rounded border border-fuchsia-500/30">PRO</span></span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 text-white font-bold text-xs px-4 py-2 rounded-xl purple-glow transition-all flex items-center gap-1.5"
          >
            <span>+ Log Trade</span>
          </button>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/50 px-3 py-2 rounded-xl text-xs text-purple-200 transition-all"
          >
            <span>👤</span>
            <span className="hidden sm:inline">{currentUser ? currentUser.split('@')[0] : 'Sign In'}</span>
          </button>
        </div>
      </header>

      {/* BODY LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* COMPREHENSIVE LEFT SIDEBAR NAVIGATION & TOOLS */}
        <aside className="w-64 bg-[#0a0416]/90 border-r border-purple-900/40 flex flex-col p-4 shrink-0 font-mono overflow-y-auto space-y-4">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest px-2">Navigation</span>
          <div className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'journal', label: 'Trades Journal', icon: '📖' },
              { id: 'strategies', label: 'Strategies & Setups', icon: '🎯' },
              { id: 'calculator', label: 'Position Sizer', icon: '🧮' },
              { id: 'calendar', label: 'Calendar', icon: '📅' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-purple-600/30 to-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/40 purple-glow'
                    : 'text-purple-300/70 hover:text-white hover:bg-purple-900/20'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* CAPITAL & FEE CONTROLS WIDGET */}
          <div className="bg-[#080314] p-4 rounded-2xl border border-purple-900/40 space-y-3">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Account Settings</span>
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
            <div className="pt-2 border-t border-purple-900/40 text-[10px] text-fuchsia-300 flex justify-between">
              <span>1% Risk:</span> <strong>${(stats.currentCapital * 0.01).toFixed(2)}</strong>
            </div>
          </div>

          {/* QUICK POSITION SIZER WIDGET */}
          <div className="bg-[#080314] p-4 rounded-2xl border border-purple-900/40 space-y-2">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Quick Position Sizer</span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div><label className="text-purple-400 block">Entry</label><input type="number" value={calcEntry} onChange={e => setCalcEntry(parseFloat(e.target.value)||0)} className="w-full bg-[#12082b] p-1.5 rounded border border-purple-800/60 text-white" /></div>
              <div><label className="text-purple-400 block">Stop Loss</label><input type="number" value={calcSl} onChange={e => setCalcSl(parseFloat(e.target.value)||0)} className="w-full bg-[#12082b] p-1.5 rounded border border-purple-800/60 text-white" /></div>
            </div>
            <div className="pt-2 text-[10px] text-emerald-400 font-bold flex justify-between">
              <span>Units:</span>
              <span>{Math.abs(calcEntry - calcSl) > 0 ? ((stats.currentCapital * (calcRiskPct / 100)) / Math.abs(calcEntry - calcSl)).toFixed(2) : 0}</span>
            </div>
          </div>
        </aside>

        {/* MAIN VIEW AREA */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* TOP METRICS & WIN RATE COUNTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                <div className="bg-[#0e061d]/90 border border-purple-900/40 p-5 rounded-2xl shadow-xl">
                  <span className="text-xs text-purple-400 uppercase">Account Equity</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">${stats.currentCapital.toFixed(2)}</div>
                </div>
                <div className="bg-[#0e061d]/90 border border-purple-900/40 p-5 rounded-2xl shadow-xl">
                  <span className="text-xs text-purple-400 uppercase">Win / Loss Ratio</span>
                  <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                    <span className="text-emerald-400">{stats.winsCount}W</span> / <span className="text-rose-400">{stats.lossesCount}L</span>
                    <span className="text-xs text-fuchsia-300 font-normal">({stats.winRate.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="bg-[#0e061d]/90 border border-purple-900/40 p-5 rounded-2xl shadow-xl">
                  <span className="text-xs text-purple-400 uppercase">Net Profit (P&L)</span>
                  <div className={`text-2xl font-bold mt-1 ${stats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${stats.netPnl.toFixed(2)}
                  </div>
                </div>
                <div className="bg-[#0e061d]/90 border border-purple-900/40 p-5 rounded-2xl shadow-xl">
                  <span className="text-xs text-purple-400 uppercase">Total Commissions</span>
                  <div className="text-2xl font-bold text-amber-400 mt-1">${stats.totalFees.toFixed(2)}</div>
                </div>
              </div>

              {/* MODERN SVG LINE VISUALIZER (EQUITY CURVE) */}
              <div className="bg-[#0e061d]/90 border border-purple-900/40 rounded-3xl p-6 shadow-xl purple-glow space-y-4">
                <div className="flex items-center justify-between font-mono">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Portfolio Performance & Equity Curve</h3>
                  <span className="text-xs font-bold text-fuchsia-400">Live Compound Tracker</span>
                </div>
                <div className="h-64 w-full bg-[#070312] rounded-2xl border border-purple-900/30 p-4 relative overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c084fc" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Render modern line chart path */}
                    <path
                      d={cumulativeData.map((val, idx) => {
                        const x = (idx / Math.max(cumulativeData.length - 1, 1)) * 560 + 20;
                        const y = 180 - ((val - startingCapital + 500) / 2000) * 140;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${Math.max(20, Math.min(180, y))}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#d8b4fe"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

            </div>
          )}

          {/* JOURNAL TAB */}
          {activeTab === 'journal' && (
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
                    <th className="py-3 px-3 text-center">Chart</th>
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

          {/* STRATEGIES TAB */}
          {activeTab === 'strategies' && (
            <div className="bg-[#0e061d]/90 border border-purple-900/40 rounded-3xl p-6 shadow-xl font-mono space-y-4">
              <h3 className="text-base font-bold text-white mb-4">Strategy & Setup Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(stats.setupMap || {}).map(([setup, data]: any) => (
                  <div key={setup} className="bg-[#070312] border border-purple-900/40 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between font-bold"><span className="text-white">{setup}</span><span className={data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${data.pnl.toFixed(2)}</span></div>
                    <div className="text-xs text-purple-400 flex justify-between"><span>Trades: {data.count}</span><span>Win Rate: {((data.wins / data.count) * 100).toFixed(0)}%</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSITION SIZER TAB */}
          {activeTab === 'calculator' && (
            <div className="max-w-xl mx-auto bg-[#0e061d] border border-purple-900/40 p-6 rounded-3xl shadow-xl font-mono space-y-4">
              <h3 className="text-sm font-bold text-white uppercase border-b border-purple-900/40 pb-3">Advanced Position Size Calculator</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-purple-400 block mb-1">Symbol</label><input value={calcSymbol} onChange={e => setCalcSymbol(e.target.value)} className="w-full bg-[#070312] text-white p-2 rounded-xl border border-purple-800/60 text-xs" /></div>
                <div><label className="text-[10px] text-purple-400 block mb-1">Risk %</label><input type="number" value={calcRiskPct} onChange={e => setCalcRiskPct(parseFloat(e.target.value) || 1)} className="w-full bg-[#070312] text-white p-2 rounded-xl border border-purple-800/60 text-xs" /></div>
                <div><label className="text-[10px] text-purple-400 block mb-1">Entry Price ($)</label><input type="number" value={calcEntry} onChange={e => setCalcEntry(parseFloat(e.target.value) || 0)} className="w-full bg-[#070312] text-white p-2 rounded-xl border border-purple-800/60 text-xs" /></div>
                <div><label className="text-[10px] text-purple-400 block mb-1">Stop Loss ($)</label><input type="number" value={calcSl} onChange={e => setCalcSl(parseFloat(e.target.value) || 0)} className="w-full bg-[#070312] text-white p-2 rounded-xl border border-purple-800/60 text-xs" /></div>
              </div>
              <div className="p-4 bg-[#070312] rounded-2xl border border-purple-900/40 space-y-2 text-xs">
                <div className="flex justify-between"><span>Cash at Risk:</span> <strong className="text-amber-400">${(stats.currentCapital * (calcRiskPct / 100)).toFixed(2)}</strong></div>
                <div className="flex justify-between"><span>Required Units:</span> <strong className="text-emerald-400">{Math.abs(calcEntry - calcSl) > 0 ? ((stats.currentCapital * (calcRiskPct / 100)) / Math.abs(calcEntry - calcSl)).toFixed(2) : 0}</strong></div>
              </div>
            </div>
          )}

          {/* CALENDAR VIEW */}
          {activeTab === 'calendar' && (
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

      {/* AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#110726] border border-purple-800/60 rounded-3xl w-full max-w-sm p-6 space-y-4 font-mono text-xs shadow-2xl purple-glow">
            <div className="flex justify-between items-center border-b border-purple-900/60 pb-3">
              <h3 className="font-bold text-white text-sm">{authMode === 'login' ? 'SIGN IN TO TRADEZELLA' : 'CREATE ACCOUNT'}</h3>
              <button onClick={() => setIsAuthModalOpen(false)} className="text-purple-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              setCurrentUser(fd.get('email')?.toString() || 'trader@tradezella.pro');
              setIsAuthModalOpen(false);
            }} className="space-y-3">
              <div><label className="text-purple-300 block mb-1">Email Address</label><input name="email" type="email" defaultValue={currentUser || ''} className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60 text-xs" required /></div>
              <div><label className="text-purple-300 block mb-1">Password</label><input name="password" type="password" defaultValue="********" className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60 text-xs" required /></div>
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-fuchsia-400 text-[10px] underline">{authMode === 'login' ? 'Need an account? Sign up' : 'Existing user? Sign in'}</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg">{authMode === 'login' ? 'Sign In' : 'Sign Up'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
