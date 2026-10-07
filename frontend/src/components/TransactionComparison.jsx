import React, { useState } from 'react';
import { GitCompare, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function TransactionComparison({ currentTx, currentResult }) {
  const [tx2, setTx2] = useState({
    step: 10,
    type: 'PAYMENT',
    amount: 50.0,
    oldbalanceOrg: 500.0,
    oldbalanceDest: 0.0
  });

  const [result2, setResult2] = useState(null);
  const [loading, setLoading] = useState(false);

  const runCompare = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx2)
      });
      if (res.ok) {
        setResult2(await res.json());
      }
    } catch (err) {
      console.error("Comparison request failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-sky-400" />
          Side-by-Side Transaction Comparator
        </h3>
        <button
          onClick={runCompare}
          disabled={loading}
          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition"
        >
          {loading ? 'Evaluating...' : 'Run Comparison'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Transaction 1 (Current) */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-sky-400">TRANSACTION #1 (ACTIVE)</span>
            {currentResult && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentResult.is_fraud ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {currentResult.is_fraud ? 'FRAUD' : 'LEGIT'}
              </span>
            )}
          </div>

          {currentResult ? (
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Type:</span>
                <span className="text-white font-bold">{currentResult.features_used.type_TRANSFER ? 'TRANSFER' : 'CASH_OUT'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="text-sky-400 font-bold">${currentResult.features_used.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Origin Balance:</span>
                <span>${currentResult.features_used.oldbalanceOrg?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount/Org Ratio:</span>
                <span className="text-amber-400 font-bold">{currentResult.features_used.amount_to_oldbalance_ratio?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                <span className="text-slate-400 font-sans">Probability:</span>
                <span className="font-bold text-white">{(currentResult.probability * 100).toFixed(2)}%</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">Run a prediction in the simulator first.</p>
          )}
        </div>

        {/* Right Column: Transaction 2 (Comparator) */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-indigo-400">TRANSACTION #2 (COMPARATOR)</span>
            {result2 && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                result2.is_fraud ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {result2.is_fraud ? 'FRAUD' : 'LEGIT'}
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500">Type</label>
                <select
                  value={tx2.type}
                  onChange={(e) => setTx2({ ...tx2, type: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                >
                  <option value="PAYMENT">PAYMENT</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="CASH_OUT">CASH_OUT</option>
                  <option value="DEBIT">DEBIT</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500">Amount ($)</label>
                <input
                  type="number"
                  value={tx2.amount}
                  onChange={(e) => setTx2({ ...tx2, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs"
                />
              </div>
            </div>

            {result2 && (
              <div className="space-y-2 text-xs font-mono text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount/Org Ratio:</span>
                  <span className="text-amber-400 font-bold">{result2.features_used.amount_to_oldbalance_ratio?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-slate-400 font-sans">Probability:</span>
                  <span className="font-bold text-white">{(result2.probability * 100).toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
