import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, Zap, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';

const PRESETS = [
  {
    name: "Fraud Transfer Sample",
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
    name: "Fraud CashOut Sample",
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
    name: "Legit Payment Sample",
    data: {
      step: 10,
      type: "PAYMENT",
      amount: 150.0,
      nameOrig: "C123456789",
      oldbalanceOrg: 1200.0,
      newbalanceOrig: 1050.0,
      nameDest: "M987654321",
      oldbalanceDest: 0.0,
      newbalanceDest: 0.0
    }
  }
];

export default function PredictorForm({ initialData, onPredictionSuccess }) {
  const [formData, setFormData] = useState(initialData || PRESETS[0].data);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'type' || name === 'nameOrig' || name === 'nameDest' ? value : parseFloat(value) || 0
    }));
  };

  const loadPreset = (preset) => {
    setFormData(preset.data);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const data = await response.json();
      setResult(data);
      if (onPredictionSuccess) onPredictionSuccess(data);
    } catch (err) {
      setError(err.message || 'Failed to submit transaction for prediction.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-7 bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-sky-400" />
            Transaction Evaluation Simulator
          </h2>
          <div className="flex gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadPreset(preset)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600 transition"
              >
                {preset.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Transaction Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              >
                <option value="TRANSFER">TRANSFER (High Fraud Risk)</option>
                <option value="CASH_OUT">CASH_OUT (High Fraud Risk)</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="DEBIT">DEBIT</option>
                <option value="CASH_IN">CASH_IN</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Time Step (Hours: 1–744)</label>
              <input
                type="number"
                name="step"
                value={formData.step}
                onChange={handleChange}
                min="1"
                max="744"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Transaction Amount ($)</label>
            <input
              type="number"
              name="amount"
              step="any"
              value={formData.amount}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-700/60 pt-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Origin Old Balance ($)</label>
              <input
                type="number"
                name="oldbalanceOrg"
                step="any"
                value={formData.oldbalanceOrg}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Destination Old Balance ($)</label>
              <input
                type="number"
                name="oldbalanceDest"
                step="any"
                value={formData.oldbalanceDest}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-lg shadow-sky-900/30"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Model...
                </>
              ) : (
                <>
                  Run XGBoost Prediction <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-5 flex flex-col justify-between">
        {error && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 text-red-400 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Prediction Failed</p>
              <p className="text-xs text-red-300/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!result && !error && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[300px]">
            <Zap className="w-12 h-12 text-slate-600 mb-3" />
            <p className="font-medium text-slate-300">Ready for Evaluation</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Click "Run XGBoost Prediction" to compute real-time fraud probability using the production temporal model.
            </p>
          </div>
        )}

        {result && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 space-y-6 shadow-xl backdrop-blur-sm">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                {result.is_fraud ? (
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                )}
                <div>
                  <h3 className="font-bold text-white leading-none">
                    {result.is_fraud ? "FRAUD DETECTED" : "LEGITIMATE TRANSACTION"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {result.prediction_id}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(result.risk_level)}`}>
                {result.risk_level} RISK
              </span>
            </div>

            {/* Probability Gauge */}
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-slate-400 font-medium">Fraud Probability</span>
                <span className="font-mono font-bold text-white text-base">
                  {(result.probability * 100).toFixed(2)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    result.is_fraud ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(result.probability * 100, 2)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>0.00% (Legit)</span>
                <span className="text-sky-400 font-semibold">Threshold: 90.00%</span>
                <span>100.00% (Fraud)</span>
              </div>
            </div>

            {/* Risk Signals */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descriptive Risk Signals</h4>
              <div className="space-y-1.5">
                {result.risk_signals.map((sig, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{sig}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Ratios breakdown */}
            <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>amount_to_oldbalance_ratio:</span>
                <span className="text-white font-bold">{result.features_used.amount_to_oldbalance_ratio.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>amount_to_dest_balance_ratio:</span>
                <span className="text-white font-bold">{result.features_used.amount_to_dest_balance_ratio.toFixed(4)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
