import React from 'react';
import { Microscope, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TransactionForensics({ features, txInput }) {
  if (!features) return null;

  const ratioOrg = features.amount_to_oldbalance_ratio || 0.0;
  const ratioDest = features.amount_to_dest_balance_ratio || 0.0;

  const isHighOrgRatio = ratioOrg >= 1.0;
  const isHighDestRatio = ratioDest > 10.0;

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Microscope className="w-5 h-5 text-sky-400" />
          Transaction Forensics & Derived Ratios
        </h3>
        <span className="text-xs font-mono text-slate-400">Step #{features.step}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Transaction Category</span>
          <p className="text-sm font-bold text-white mt-0.5">{txInput?.type || 'TRANSFER'}</p>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Transaction Amount</span>
          <p className="text-sm font-bold font-mono text-sky-400 mt-0.5">${features.amount?.toLocaleString()}</p>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Origin Initial Balance</span>
          <p className="text-sm font-bold font-mono text-slate-200 mt-0.5">${features.oldbalanceOrg?.toLocaleString()}</p>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Destination Initial Balance</span>
          <p className="text-sm font-bold font-mono text-slate-200 mt-0.5">${features.oldbalanceDest?.toLocaleString()}</p>
        </div>
      </div>

      {/* Derived Ratios Highlight Box */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Engineered Leakage-Safe Feature Ratios</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Origin Ratio Card */}
          <div className={`p-4 rounded-xl border transition ${
            isHighOrgRatio 
              ? 'bg-red-500/10 border-red-500/50 text-red-300' 
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono font-semibold">amount_to_oldbalance_ratio</span>
                <p className="text-xs text-slate-400 mt-0.5">Amount / Origin Balance</p>
              </div>
              {isHighOrgRatio ? (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-white">{ratioOrg.toFixed(4)}</span>
              {isHighOrgRatio && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400">
                  Account Drain (100%)
                </span>
              )}
            </div>
          </div>

          {/* Destination Ratio Card */}
          <div className={`p-4 rounded-xl border transition ${
            isHighDestRatio 
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-300' 
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono font-semibold">amount_to_dest_balance_ratio</span>
                <p className="text-xs text-slate-400 mt-0.5">Amount / Destination Balance</p>
              </div>
              {isHighDestRatio ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-white">{ratioDest.toFixed(4)}</span>
              {isHighDestRatio && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400">
                  Dest Anomaly
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
