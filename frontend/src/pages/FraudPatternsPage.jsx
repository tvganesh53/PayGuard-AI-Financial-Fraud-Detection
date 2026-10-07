import React, { useState, useEffect } from 'react';
import { GitFork, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function FraudPatternsPage() {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/patterns')
      .then(res => res.json())
      .then(data => setPatterns(data.patterns || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-l-4 border-amber-500">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GitFork className="w-5 h-5 text-amber-400" />
          PaySim Fraud Pattern Typologies
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Identified fraud attack vectors and behavioral transaction clusters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patterns.map((pat, idx) => (
          <div key={idx} className="glass-panel p-6 space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                  PATTERN TYPOLOGY #{idx + 1}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{pat.pattern_name}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                pat.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {pat.risk_level} RISK
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{pat.description}</p>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 block">TRANSACTIONS</span>
                <span className="font-bold text-white">{pat.transaction_count.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">FRAUD COUNT</span>
                <span className="font-bold text-red-400">{pat.fraud_count.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">FRAUD RATE</span>
                <span className="font-bold text-amber-400">{pat.fraud_rate_percentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
