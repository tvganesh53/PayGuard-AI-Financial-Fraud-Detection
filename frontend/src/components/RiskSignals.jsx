import React from 'react';
import { AlertTriangle, Info, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function RiskSignals({ signals = [] }) {
  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Descriptive Risk Signals & Evidence
          </h3>
          <p className="text-[11px] text-sky-400/80 font-mono mt-0.5">
            Descriptive Risk Signals – Model Decision Remains XGBoost Based
          </p>
        </div>
        <span className="px-2.5 py-1 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          UI Explanation Layer
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {signals.map((sig, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-3 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 hover:border-slate-700 transition"
          >
            <div className="p-1.5 bg-amber-500/10 rounded-lg shrink-0 mt-0.5">
              <Info className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">{sig}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Descriptive indicator identified from transaction feature properties.
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
        <span>
          Risk signals provide auxiliary context for compliance teams. They do not alter or override the XGBoost tree probability.
        </span>
      </div>
    </div>
  );
}
