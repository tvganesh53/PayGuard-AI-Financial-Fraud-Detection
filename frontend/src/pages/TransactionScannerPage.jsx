import React, { useState } from 'react';
import { 
  Search, RefreshCw, Zap, ShieldAlert, ShieldCheck, 
  ArrowRight, Activity, AlertTriangle, Layers, Copy, Check 
} from 'lucide-react';
import { predictTransaction, getDatasetSample } from '../services/api';

const PRESETS = [
  {
    name: "Fraud Example (TRANSFER)",
    data: {
      step: 1,
      type: "TRANSFER",
      amount: 181000.0,
      nameOrig: "C1305486145",
      oldbalanceOrg: 181000.0,
      newbalanceOrig: 0.0,
      nameDest: "C553264065",
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0
    }
  },
  {
    name: "Fraud Example (CASH_OUT)",
    data: {
      step: 1,
      type: "CASH_OUT",
      amount: 181000.0,
      nameOrig: "C840083671",
      oldbalanceOrg: 181000.0,
      newbalanceOrig: 0.0,
      nameDest: "C38997010",
      oldbalanceDest: 21182.0,
      newbalanceDest: 0.0
    }
  },
  {
    name: "Legitimate Example (PAYMENT)",
    data: {
      step: 10,
      type: "PAYMENT",
      amount: 50.0,
      nameOrig: "C123456789",
      oldbalanceOrg: 500.0,
      newbalanceOrig: 450.0,
      nameDest: "M987654321",
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0
    }
  }
];

export default function TransactionScannerPage({ onSelectTransaction }) {
  const [formData, setFormData] = useState(PRESETS[0].data);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'type' || name === 'nameOrig' || name === 'nameDest' ? value : parseFloat(value) || 0
    }));
  };

  const handlePredict = async (payload = formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictTransaction(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRandomSample = async () => {
    try {
      const sample = await getDatasetSample();
      if (sample.data && sample.data.length > 0) {
        const rand = sample.data[Math.floor(Math.random() * sample.data.length)];
        const newForm = {
          step: rand.step || 1,
          type: rand.type || "TRANSFER",
          amount: rand.amount || 1000.0,
          nameOrig: rand.nameOrig || "C123456",
          oldbalanceOrg: rand.oldbalanceOrg || 1000.0,
          newbalanceOrig: rand.newbalanceOrig || 0.0,
          nameDest: rand.nameDest || "M987654",
          oldbalanceDest: rand.oldbalanceDest || 0.0,
          newbalanceDest: rand.newbalanceDest || 0.0
        };
        setFormData(newForm);
        handlePredict(newForm);
      }
    } catch (err) {
      console.error("Sample load error:", err);
    }
  };

  const handleCopyId = () => {
    if (result && result.prediction_id) {
      navigator.clipboard.writeText(result.prediction_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Presets Bar */}
      <div className="fintech-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="font-display font-bold text-xs text-white uppercase tracking-wider">Quick Sample Presets:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFormData(preset.data);
                handlePredict(preset.data);
              }}
              className="px-3 py-1.5 bg-[#111827] hover:bg-[#1f2937] text-slate-300 rounded-lg text-xs font-sans font-medium border border-[#1f2937] transition"
            >
              {preset.name}
            </button>
          ))}
          <button
            onClick={handleLoadRandomSample}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-sans font-semibold border border-emerald-500/30 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Random PaySim Row
          </button>
        </div>
      </div>

      {/* Main Form + Prediction Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: 9-Feature Input Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="fintech-card p-6 space-y-4">
            <h3 className="font-display font-bold text-xs text-white flex items-center gap-2 border-b border-[#1f2937] pb-3 uppercase tracking-wider">
              <Search className="w-4 h-4 text-emerald-400" />
              Production Transaction Inputs
            </h3>

            <form onSubmit={(e) => { e.preventDefault(); handlePredict(); }} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-medium text-slate-400 mb-1">Transaction Category (type)</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full bg-[#0b0f19] border border-[#1f2937] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-slate-500"
                >
                  <option value="TRANSFER">TRANSFER (High Risk Stream)</option>
                  <option value="CASH_OUT">CASH_OUT (High Risk Stream)</option>
                  <option value="PAYMENT">PAYMENT</option>
                  <option value="DEBIT">DEBIT</option>
                  <option value="CASH_IN">CASH_IN</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-400 mb-1">Step (Hours: 1–744)</label>
                  <input
                    type="number"
                    name="step"
                    value={formData.step}
                    onChange={handleChange}
                    min="1"
                    className="w-full bg-[#0b0f19] border border-[#1f2937] rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-400 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    name="amount"
                    step="any"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full bg-[#0b0f19] border border-[#1f2937] rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Origin Account */}
              <div className="border-t border-[#1f2937] pt-3 space-y-2">
                <span className="font-display text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Origin Account</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Sender ID (nameOrig)</label>
                    <input
                      type="text"
                      name="nameOrig"
                      value={formData.nameOrig || ''}
                      onChange={handleChange}
                      className="w-full bg-[#0b0f19] border border-[#1f2937] rounded-lg px-3 py-2 text-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Old Balance ($)</label>
                    <input
                      type="number"
                      name="oldbalanceOrg"
                      step="any"
                      value={formData.oldbalanceOrg}
                      onChange={handleChange}
                      className="w-full bg-[#0b0f19] border border-[#1f2937] rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Destination Account */}
              <div className="border-t border-[#1f2937] pt-3 space-y-2">
                <span className="font-display text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Destination Account</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Receiver ID (nameDest)</label>
                    <input
                      type="text"
                      name="nameDest"
                      value={formData.nameDest || ''}
                      onChange={handleChange}
                      className="w-full bg-[#0b0f19] border border-[#1f2937] rounded-lg px-3 py-2 text-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Old Balance ($)</label>
                    <input
                      type="number"
                      name="oldbalanceDest"
                      step="any"
                      value={formData.oldbalanceDest}
                      onChange={handleChange}
                      className="w-full bg-[#0b0f19] border border-[#1f2937] rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(PRESETS[2].data)}
                  className="px-4 py-2.5 bg-[#111827] hover:bg-[#1f2937] text-slate-300 font-sans font-semibold rounded-lg border border-[#1f2937] transition text-xs"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#1f2937] text-white font-display font-bold rounded-lg flex items-center justify-center gap-2 transition text-xs tracking-wider shadow-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> EVALUATING XGBOOST...
                    </>
                  ) : (
                    <>
                      ANALYZE TRANSACTION <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Real Prediction Assessment Panel */}
        <div className="lg:col-span-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          {!result && !loading && (
            <div className="fintech-card p-12 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="font-display font-bold text-sm text-slate-300">Ready for Assessment</h4>
              <p className="font-sans text-xs text-slate-500 max-w-sm mx-auto">
                Fill in the 9 production features on the left or select a scenario preset to run real XGBoost inference.
              </p>
            </div>
          )}

          {result && (
            <div className="fintech-card p-6 space-y-5">
              {/* Top Decision Header */}
              <div className="flex justify-between items-start border-b border-[#1f2937] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400 font-bold">{result.prediction_id}</span>
                    <button onClick={handleCopyId} className="p-1 hover:bg-[#1f2937] rounded text-slate-400">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h3 className="font-display font-black text-2xl text-white tracking-wide uppercase mt-1">
                    {result.is_fraud ? "FRAUD DETECTED" : "LEGITIMATE TRANSACTION"}
                  </h3>
                </div>

                <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border ${
                  result.risk_level === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                  result.risk_level === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                  result.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {result.risk_level} RISK
                </span>
              </div>

              {/* Large Probability Gauge Card */}
              <div className="p-5 bg-[#0b0f19] border border-[#1f2937] rounded-xl space-y-3">
                <div className="flex justify-between items-end font-mono">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-sans">Fraud Probability</span>
                    <span className={`text-3xl font-black ${result.is_fraud ? 'text-red-400' : 'text-emerald-400'}`}>
                      {(result.probability * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-sans">Decision Rule</span>
                    <span className="text-xs text-slate-200 font-bold">
                      {result.is_fraud ? '≥ 90.00% Threshold' : '< 90.00% Threshold'}
                    </span>
                  </div>
                </div>

                {/* Gauge Progress Bar */}
                <div className="w-full h-3 bg-[#1f2937] rounded-full overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-500 ${
                      result.is_fraud ? 'bg-red-500' : result.probability >= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, result.probability * 100))}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md"
                    style={{ left: '90%' }}
                    title="Production Threshold: 90%"
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-1">
                  <span>0%</span>
                  <span className="text-slate-300 font-bold">Production Threshold: 90%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Model Info Specs */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-[#0b0f19] border border-[#1f2937] rounded-lg">
                  <span className="text-slate-500 block font-sans text-[11px]">Deployed Model</span>
                  <span className="font-bold text-white mt-0.5 block">XGBoost (Class Weight)</span>
                </div>
                <div className="p-3 bg-[#0b0f19] border border-[#1f2937] rounded-lg">
                  <span className="text-slate-500 block font-sans text-[11px]">Decision Threshold</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block">0.90 (90.00%)</span>
                </div>
              </div>

              {/* Risk Signals */}
              {result.risk_signals && result.risk_signals.length > 0 && (
                <div className="space-y-2">
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Triggered Risk Signals
                  </span>
                  <div className="space-y-1.5">
                    {result.risk_signals.map((sig, idx) => (
                      <div key={idx} className="p-2.5 bg-[#0b0f19] border border-[#1f2937] rounded-lg text-xs text-slate-300 font-sans flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SHAP Preview */}
              {result.shap_values && Object.keys(result.shap_values).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#1f2937]">
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" /> SHAP Feature Impact Preview
                  </span>
                  <div className="bg-[#0b0f19] border border-[#1f2937] rounded-lg p-3 space-y-2 text-xs font-mono">
                    {Object.entries(result.shap_values)
                      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                      .slice(0, 4)
                      .map(([feat, val], idx) => {
                        const num = typeof val === 'number' ? val : parseFloat(val) || 0;
                        const isPos = num > 0;
                        return (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-slate-300 truncate">{feat}</span>
                            <span className={`font-bold ${isPos ? 'text-red-400' : 'text-emerald-400'}`}>
                              {isPos ? `+${num.toFixed(4)}` : num.toFixed(4)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Full Inspection Trigger */}
              {onSelectTransaction && (
                <button
                  onClick={() => onSelectTransaction(result)}
                  className="w-full py-2.5 bg-[#1f2937] hover:bg-[#374151] text-white font-display font-bold text-xs rounded-lg transition border border-slate-700"
                >
                  OPEN INVESTIGATION DRAWER &rarr;
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
