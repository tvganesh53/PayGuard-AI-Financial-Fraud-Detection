import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, RefreshCw, AlertTriangle, ShieldCheck, 
  TrendingUp, TrendingDown, Layers, HelpCircle 
} from 'lucide-react';
import { predictTransaction, getModelInfo } from '../services/api';

export default function ExplainableAIPage({ initialPrediction }) {
  const [prediction, setPrediction] = useState(initialPrediction || null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getModelInfo().then(data => setModelInfo(data)).catch(() => null);

    if (!initialPrediction) {
      loadSamplePrediction();
    }
  }, [initialPrediction]);

  const loadSamplePrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const samplePayload = {
        step: 1,
        type: "TRANSFER",
        amount: 181000.0,
        nameOrig: "C1305486145",
        oldbalanceOrg: 181000.0,
        newbalanceOrig: 0.0,
        nameDest: "C553264065",
        oldbalanceDest: 0.0,
        newbalanceDest: 0.0
      };
      const data = await predictTransaction(samplePayload);
      setPrediction(data);
    } catch (err) {
      setError(err.message || "Failed to load sample prediction for SHAP analysis.");
    } finally {
      setLoading(false);
    }
  };

  const shapValues = prediction?.shap_values || {};
  const entries = Object.entries(shapValues).map(([feat, val]) => {
    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
    return {
      feature: feat,
      value: num,
      absVal: Math.abs(num),
      isPositive: num > 0
    };
  }).sort((a, b) => b.absVal - a.absVal);

  const fraudDrivers = entries.filter(e => e.isPositive);
  const protectiveFactors = entries.filter(e => !e.isPositive);

  const maxAbs = entries.length > 0 ? Math.max(...entries.map(e => e.absVal), 0.001) : 1;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-display text-[11px] font-bold px-2.5 py-1 rounded bg-[#1f2937] text-emerald-400 uppercase tracking-widest inline-block mb-1 border border-[#374151]">
            EXPLAINABLE AI (XAI) ENGINE
          </span>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white uppercase tracking-wide">
            Native SHAP Feature Contribution Analysis
          </h2>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Real Shapley Additive Explanations calculated for XGBoost tree ensembles. No synthetic values.
          </p>
        </div>

        <button
          onClick={loadSamplePrediction}
          disabled={loading}
          className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-200 text-xs font-display font-bold rounded-lg border border-[#374151] flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Sample Case</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {prediction && (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Fraud Drivers */}
            <div className="fintech-card p-5 border-red-500/30 space-y-3">
              <h3 className="font-display font-bold text-xs text-red-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-400" />
                Top Fraud Drivers (Pushes Towards Fraud [+])
              </h3>
              <div className="space-y-2">
                {fraudDrivers.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#0b0f19] border border-[#1f2937] rounded-lg flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-200 font-bold truncate">{item.feature}</span>
                    <span className="text-red-400 font-extrabold">+{item.value.toFixed(4)}</span>
                  </div>
                ))}
                {fraudDrivers.length === 0 && (
                  <p className="text-xs text-slate-500 font-sans italic">No positive fraud drivers for this transaction.</p>
                )}
              </div>
            </div>

            {/* Top Protective Factors */}
            <div className="fintech-card p-5 border-emerald-500/30 space-y-3">
              <h3 className="font-display font-bold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                Top Protective Factors (Pushes Towards Legitimate [-])
              </h3>
              <div className="space-y-2">
                {protectiveFactors.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#0b0f19] border border-[#1f2937] rounded-lg flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-200 font-bold truncate">{item.feature}</span>
                    <span className="text-emerald-400 font-extrabold">{item.value.toFixed(4)}</span>
                  </div>
                ))}
                {protectiveFactors.length === 0 && (
                  <p className="text-xs text-slate-500 font-sans italic">No negative protective factors for this transaction.</p>
                )}
              </div>
            </div>
          </div>

          {/* Horizontal SHAP Bar Chart */}
          <div className="fintech-card p-6 space-y-4">
            <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
              SHAP Contribution Waterfall Chart
            </h3>

            <div className="space-y-3 font-mono text-xs pt-2">
              {entries.map((item, idx) => {
                const widthPct = Math.min(100, Math.max(5, (item.absVal / maxAbs) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-bold">{item.feature}</span>
                      <span className={`font-bold ${item.isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.isPositive ? `+${item.value.toFixed(4)}` : item.value.toFixed(4)}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-[#0b0f19] border border-[#1f2937] rounded-full overflow-hidden flex items-center px-0.5">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          item.isPositive ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Feature Impact Table */}
          <div className="fintech-card p-6 space-y-4">
            <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
              Complete Feature Impact Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#1f2937]/50 text-slate-400 font-display font-bold uppercase text-[10px] tracking-wider border-b border-[#1f2937]">
                  <tr>
                    <th className="px-3 py-2.5">Feature Name</th>
                    <th className="px-3 py-2.5">SHAP Contribution</th>
                    <th className="px-3 py-2.5">Direction</th>
                    <th className="px-3 py-2.5">Impact Magnitude</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2937]">
                  {entries.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#1f2937]/30 transition">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-200">{item.feature}</td>
                      <td className={`px-3 py-2.5 font-mono font-extrabold ${item.isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                        {item.isPositive ? `+${item.value.toFixed(4)}` : item.value.toFixed(4)}
                      </td>
                      <td className="px-3 py-2.5 font-mono">
                        {item.isPositive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/30">
                            Towards Fraud [+]
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Towards Legitimate [-]
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-400">
                        {item.absVal > 1.0 ? 'HIGH IMPACT' : item.absVal > 0.2 ? 'MEDIUM IMPACT' : 'LOW IMPACT'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
