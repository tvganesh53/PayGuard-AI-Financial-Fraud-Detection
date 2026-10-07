import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, ShieldCheck, Microscope, Layers, ArrowRight, FileText, GitCompare, RefreshCw } from 'lucide-react';

export default function TransactionDrawer({ isOpen, onClose, transactionData, onInvestigate }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && transactionData) {
      fetchPrediction(transactionData);
    } else {
      setPrediction(null);
    }
  }, [isOpen, transactionData]);

  const fetchPrediction = async (tx) => {
    setLoading(true);
    try {
      const payload = {
        step: tx.step || 1,
        type: tx.type || "TRANSFER",
        amount: tx.amount || 0.0,
        nameOrig: tx.nameOrig || "C123456",
        oldbalanceOrg: tx.oldbalanceOrg || 0.0,
        newbalanceOrig: tx.newbalanceOrig || 0.0,
        nameDest: tx.nameDest || "M987654",
        oldbalanceDest: tx.oldbalanceDest || 0.0,
        newbalanceDest: tx.newbalanceDest || 0.0
      };

      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setPrediction(await res.json());
      }
    } catch (err) {
      console.error("Drawer prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !transactionData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="font-mono text-[10px] uppercase text-sky-400 font-bold tracking-widest">
                TRANSACTION FORENSICS DRAWER
              </span>
              <h3 className="font-display font-extrabold text-xl text-white mt-0.5">
                {transactionData.type || 'TRANSACTION'} EVALUATION
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-xs font-mono">Evaluating XGBoost 2.1.4 Tree SHAP engine...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Assessment Banner */}
              {prediction && (
                <div className={`p-5 rounded-2xl border-2 flex items-center justify-between ${
                  prediction.is_fraud ? 'bg-red-950/20 border-red-500/80 text-red-300' : 'bg-emerald-950/20 border-emerald-500/80 text-emerald-300'
                }`}>
                  <div className="flex items-center gap-3">
                    {prediction.is_fraud ? (
                      <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-mono text-[10px] text-slate-400">ID: {prediction.prediction_id}</span>
                      <h4 className="font-display font-black text-xl text-white leading-tight">
                        {prediction.is_fraud ? "FRAUD DETECTED" : "LEGITIMATE"}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        Probability: <span className="text-white font-bold">{(prediction.probability * 100).toFixed(2)}%</span> (Threshold: 90%)
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase ${
                    prediction.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                    prediction.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}>
                    {prediction.risk_level}
                  </span>
                </div>
              )}

              {/* Transaction Data Cards */}
              <div className="glass-panel p-5 space-y-3">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-sky-400" /> Transaction Parameters
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Amount</span>
                    <span className="font-bold text-sky-400 text-sm">${transactionData.amount?.toLocaleString()}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Step (Hour)</span>
                    <span className="font-bold text-white text-sm">#{transactionData.step}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Origin Balance</span>
                    <span className="font-bold text-slate-200 text-sm">${transactionData.oldbalanceOrg?.toLocaleString()}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Destination Balance</span>
                    <span className="font-bold text-slate-200 text-sm">${transactionData.oldbalanceDest?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* SHAP Feature Contribution Bars */}
              {prediction?.shap_values && (
                <div className="glass-panel p-5 space-y-3">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" /> Local Tree SHAP Contributions
                  </h4>

                  <div className="space-y-2 text-xs font-mono">
                    {Object.entries(prediction.shap_values)
                      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                      .slice(0, 6)
                      .map(([feat, val]) => (
                        <div key={feat} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-300">{feat}</span>
                            <span className={`font-bold ${val > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden p-0.5 border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                val > 0 ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(Math.abs(val) * 15, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (onInvestigate) onInvestigate(transactionData);
                    onClose();
                  }}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-950/50 transition"
                >
                  <ArrowRight className="w-4 h-4" /> Open in Investigation Terminal
                </button>
              </div>

            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
