'use client'

import React, { useState, useMemo } from 'react';

// Centralized Trade Metric Calculator with Custom Fees
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
    status: netPnl >= 0 ? 'Closed (Win)' : 'Closed (Loss)'
  };
};

const INITIAL_TRADES = [
  { id: '1', date: '2026-03-01', symbol: 'TSLA', direction: 'LONG', entryPrice: 240, exitPrice: 262, quantity: 25, stopLoss: 235, setup: 'Breakout', tvLink: 'https://www.tradingview.com', notes: 'Clean breakout.' },
  { id: '2', date: '2026-03-02', symbol: 'NVDA', direction: 'SHORT', entryPrice: 880, exitPrice: 854, quantity: 10, stopLoss: 890, setup: 'Liquidity Sweep', tvLink: '', notes: 'Reversal hold.' }
];

export default function TradingJournalSaaS() {
  const [startingCapital, setStartingCapital] = useState(25000);
  const [feePercentage, setFeePercentage] = useState(0.05);
  const [trades, setTrades] = useState(INITIAL_TRADES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  
  // New Trade Form State
  const [form, setForm] = useState({
    symbol: '',
    direction: 'LONG',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    stopLoss: '',
    setup: 'Breakout',
    tvLink: '',
    notes: ''
  });

  const feeRateDecimal = feePercentage / 100;
  const processedTrades = useMemo(() => trades.map(t => computeTradeMetrics(t, feeRateDecimal)), [trades, feeRateDecimal]);

  const stats = useMemo(() => {
    const totalTrades = processedTrades.length;
    const wins = processedTrades.filter(t => t.pnl > 0);
    const winRate = totalTrades ? (wins.length / totalTrades) * 100 : 0;
    const netPnl = processedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const currentCapital = startingCapital + netPnl;
    const totalFees = processedTrades.reduce((sum, t) => sum + t.totalFee, 0);

    return { totalTrades, netPnl, currentCapital, totalFees, winRate };
  }, [processedTrades, startingCapital]);

  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrade = {
      id: `trd-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      symbol: form.symbol,
      direction: form.direction,
      entryPrice: parseFloat(form.entryPrice) || 0,
      exitPrice: parseFloat(form.exitPrice) || 0,
      quantity: parseFloat(form.quantity) || 0,
      stopLoss: parseFloat(form.stopLoss) || 0,
      setup: form.setup,
      tvLink: form.tvLink,
      notes: form.notes
    };
    setTrades([newTrade, ...trades]);
    setIsModalOpen(false);
    setForm({ symbol: '', direction: 'LONG', entryPrice: '', exitPrice: '', quantity: '', stopLoss: '', setup: 'Breakout', tvLink: '', notes: '' });
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
    setSelectedTrade(null);
  };

  const onePercentRisk = stats.currentCapital * 0.01;

  return (
    <div className="min-h-screen bg-[#070312] text-purple-100 font-sans selection:bg-fuchsia-500 selection:text-slate-950">
      
      {/* SaaS Top Navigation Bar */}
      <header className="h-16 bg-[#0c051a] border-b border-purple-900/40 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-lg">
            <span className="font-black text-slate-950 font-mono text-sm">TZ</span>
          </div>
          <span className="font-extrabold text-white tracking-wider font-mono text-sm">TRADEZELLA <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-300 px-1.5 py-0.5 rounded border border-fuchsia-500/30">PRO SaaS</span></span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <span>+ Log Trade</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Settings Bar */}
        <div className="bg-[#0e061d] border border-purple-900/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <label className="text-[10px] text-purple-400 block mb-1">Starting Capital ($)</label>
              <input 
                type="number" 
                value={startingCapital} 
                onChange={e => setStartingCapital(parseFloat(e.target.value) || 0)}
                className="bg-[#070312] text-white p-2 rounded-xl border border-purple-800/60 w-36 focus:outline-none focus:border-fuchsia-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-purple-400 block mb-1">Execution Fee (%)</label>
              <input 
                type="number" 
                step="0.001" 
                value={feePercentage} 
                onChange={e => setFeePercentage(parseFloat(e.target.value) || 0)}
                className="bg-[#070312] text-white p-2 rounded-xl border border-purple-800/60 w-28 focus:outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>

          <div className="font-mono text-xs bg-purple-950/60 px-4 py-2 rounded-xl border border-purple-800/40 text-fuchsia-300">
            1% Risk Value: <strong>${onePercentRisk.toFixed(2)}</strong>
          </div>
        </div>

        {/* Top Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0e061d] border border-purple-900/40 p-5 rounded-2xl shadow-xl">
            <span className="text-xs text-purple-400 uppercase font-mono">Account Equity</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">${stats.currentCapital.toFixed(2)}</div>
            <span className="text-[10px] text-purple-400/70">Starting: ${startingCapital}</span>
          </div>
          <div className="bg-[#0e061d] border border-purple-900/40 p-5 rounded-2xl shadow-xl">
            <span className="text-xs text-purple-400 uppercase font-mono">Net Profit (P&L)</span>
            <div className={`text-2xl font-bold font-mono mt-1 ${stats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${stats.netPnl.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#0e061d] border border-purple-900/40 p-5 rounded-2xl shadow-xl">
            <span className="text-xs text-purple-400 uppercase font-mono">Win Rate</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{stats.winRate.toFixed(1)}%</div>
          </div>
          <div className="bg-[#0e061d] border border-purple-900/40 p-5 rounded-2xl shadow-xl">
            <span className="text-xs text-purple-400 uppercase font-mono">Total Fees Paid</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">${stats.totalFees.toFixed(2)}</div>
          </div>
        </div>

        {/* Trades Journal Table */}
        <div className="bg-[#0e061d] border border-purple-900/40 rounded-3xl p-6 shadow-xl overflow-x-auto">
          <h3 className="text-base font-bold text-white font-mono mb-4">Recent Executions & TradingView Links</h3>
          <table className="w-full text-left text-xs font-mono text-purple-200">
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
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.direction === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {t.direction}
                    </span>
                  </td>
                  <td className="py-3 px-3">${t.entryPrice} / ${t.exitPrice}</td>
                  <td className="py-3 px-3 text-right text-amber-400">${t.totalFee.toFixed(2)}</td>
                  <td className={`py-3 px-3 text-right font-bold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.pnl >= 0 ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`}
                  </td>
                  <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                    {t.tvLink ? (
                      <a href={t.tvLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline text-[10px]">Open Chart</a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>

      {/* Log Trade Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#110726] border border-purple-800/60 rounded-3xl w-full max-w-md p-6 space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-purple-900/60 pb-3">
              <h3 className="font-bold text-white text-sm">LOG NEW TRADE</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-purple-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddTrade} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-purple-300 block mb-1">Symbol</label>
                  <input type="text" value={form.symbol} onChange={e => setForm({...form, symbol: e.target.value.toUpperCase()})} placeholder="AAPL" className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60" required />
                </div>
                <div>
                  <label className="text-purple-300 block mb-1">Direction</label>
                  <select value={form.direction} onChange={e => setForm({...form, direction: e.target.value})} className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60 font-bold">
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-purple-300 block mb-1">Entry ($)</label>
                  <input type="number" step="any" value={form.entryPrice} onChange={e => setForm({...form, entryPrice: e.target.value})} className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60" required />
                </div>
                <div>
                  <label className="text-purple-300 block mb-1">Exit ($)</label>
                  <input type="number" step="any" value={form.exitPrice} onChange={e => setForm({...form, exitPrice: e.target.value})} className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60" required />
                </div>
                <div>
                  <label className="text-purple-300 block mb-1">Quantity</label>
                  <input type="number" step="any" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60" required />
                </div>
              </div>
              <div>
                <label className="text-purple-300 block mb-1">TradingView Chart Link</label>
                <input type="url" value={form.tvLink} onChange={e => setForm({...form, tvLink: e.target.value})} placeholder="https://www.tradingview.com/chart/..." className="w-full bg-[#080314] text-white p-2.5 rounded-xl border border-purple-800/60" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-purple-900/60">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-purple-950 text-purple-200 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg">Save Trade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trade Detail Modal */}
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
