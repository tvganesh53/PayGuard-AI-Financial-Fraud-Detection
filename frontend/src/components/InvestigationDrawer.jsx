import React, { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, Copy, Check, ExternalLink, ArrowRight, Activity, AlertTriangle } from 'lucide-react';

export default function InvestigationDrawer({ item, onClose, onNavigateToInvestigation }) {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleCopyId = () => {
    if (item.prediction_id) {
      navigator.clipboard.writeText(item.prediction_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const prob = typeof item.probability === 'number' ? item.probability : (parseFloat(item.probability) || 0);
  const isFraud = item.is_fraud ?? (prob >= 0.90);
  const riskLevel = item.risk_level || (prob >= 0.90 ? 'CRITICAL' : prob >= 0.70 ? 'HIGH' : prob >= 0.40 ? 'MEDIUM' : 'LOW');
  const amount = typeof item.amount === 'number' ? item.amount : (parseFloat(item.amount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer Body */}
      <div className="relative w-full max-w-xl bg-[#0b0f19] border-l border-[#1f2937] h-full overflow-y-auto z-10 flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#1f2937] flex items-center justify-between sticky top-0 bg-[#0b0f19]/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border ${
              isFraud ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {isFraud ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400 font-bold">{item.prediction_id || 'PRED-UNKNOWN'}</span>
                <button
                  onClick={handleCopyId}
                  className="p-1 hover:bg-[#1f2937] rounded text-slate-400 hover:text-slate-200 transition"
                  title="Copy Prediction ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <h3 className="font-display font-bold text-base text-white mt-0.5">
                {isFraud ? 'FRAUDULENT TRANSACTION' : 'LEGITIMATE TRANSACTION'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#111827] border border-[#1f2937] text-slate-400 hover:text-white hover:border-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Risk & Decision Summary Banner */}
          <div className="p-4 rounded-xl bg-[#111827] border border-[#1f2937] space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Fraud Probability</span>
              <span className={`text-lg font-black ${isFraud ? 'text-red-400' : 'text-emerald-400'}`}>
                {(prob * 100).toFixed(2)}%
              </span>
            </div>

            {/* Probability Progress Bar */}
            <div className="w-full h-2.5 bg-[#1f2937] rounded-full overflow-hidden relative">
              <div
                className={`h-full transition-all duration-500 ${
                  isFraud ? 'bg-red-500' : prob >= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, prob * 100))}%` }}
              />
              {/* Threshold line at 90% */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"
                style={{ left: '90%' }}
                title="Production Threshold: 90%"
              />
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1 border-t border-[#1f2937]">
              <span>Risk Level: <strong className={`font-bold ${
                riskLevel === 'CRITICAL' ? 'text-red-400' :
                riskLevel === 'HIGH' ? 'text-orange-400' :
                riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
              }`}>{riskLevel}</strong></span>
              <span>Production Threshold: <strong className="text-slate-200">90.00% (0.90)</strong></span>
            </div>
          </div>

          {/* Key Parameters Matrix */}
          <div className="space-y-2">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">
              Transaction Metadata
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#111827] border border-[#1f2937] rounded-lg">
                <span className="text-slate-400 block text-[11px]">Transaction Type</span>
                <span className="font-mono font-bold text-white mt-1 block">{item.transaction_type || item.type || 'TRANSFER'}</span>
              </div>
              <div className="p-3 bg-[#111827] border border-[#1f2937] rounded-lg">
                <span className="text-slate-400 block text-[11px]">Amount</span>
                <span className="font-mono font-bold text-slate-100 mt-1 block">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 bg-[#111827] border border-[#1f2937] rounded-lg">
                <span className="text-slate-400 block text-[11px]">Timestamp</span>
                <span className="font-mono text-slate-300 mt-1 block truncate">
                  {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-[#111827] border border-[#1f2937] rounded-lg">
                <span className="text-slate-400 block text-[11px]">Engine / Version</span>
                <span className="font-mono text-sky-400 font-semibold mt-1 block truncate">
                  {item.model_name || item.model || 'XGBoost'} (v2.0.0)
                </span>
              </div>
            </div>
          </div>

          {/* Risk Signals */}
          {item.risk_signals && item.risk_signals.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Detected Risk Signals
              </h4>
              <div className="space-y-1.5">
                {item.risk_signals.map((sig, idx) => (
                  <div key={idx} className="p-2.5 bg-[#111827] border border-[#1f2937] rounded-lg text-xs text-slate-300 flex items-start gap-2 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{sig}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHAP Summary */}
          {item.shap_values && Object.keys(item.shap_values).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" /> SHAP Feature Impact Summary
              </h4>
              <div className="bg-[#111827] border border-[#1f2937] rounded-lg p-3 space-y-2 text-xs font-mono">
                {Object.entries(item.shap_values)
                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                  .slice(0, 5)
                  .map(([feat, val], idx) => {
                    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
                    const isPos = num > 0;
                    return (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-slate-300 truncate max-w-[200px]">{feat}</span>
                        <span className={`font-bold ${isPos ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isPos ? `+${num.toFixed(4)}` : num.toFixed(4)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#1f2937] bg-[#0b0f19] space-y-3 sticky bottom-0">
          {onNavigateToInvestigation && (
            <button
              onClick={() => {
                onClose();
                onNavigateToInvestigation(item.prediction_id || item);
              }}
              className="w-full py-3 bg-[#1f2937] hover:bg-[#374151] text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition border border-slate-700"
            >
              OPEN FULL FORENSIC INVESTIGATION <ExternalLink className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-transparent hover:bg-[#111827] text-slate-400 hover:text-slate-200 font-sans text-xs font-semibold rounded-xl transition"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
