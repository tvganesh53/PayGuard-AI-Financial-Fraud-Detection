import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, X, Eye, FileSearch, Lock } from 'lucide-react';

export default function FraudAlertPanel({ result, onClose, onInvestigate }) {
  if (!result || !result.is_fraud) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          className="relative w-full max-w-lg bg-slate-950 border-2 border-red-500/80 rounded-2xl p-6 shadow-2xl shadow-red-950/80 overflow-hidden"
        >
          {/* Animated Top Header Glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-24 bg-red-600/30 blur-2xl rounded-full pointer-events-none animate-pulse" />

          <div className="flex justify-between items-start border-b border-red-500/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                <ShieldAlert className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold">
                  HIGH THREAT ALERT
                </span>
                <h3 className="text-xl font-black text-white tracking-wide">FRAUD DETECTED</h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-6 space-y-4">
            <div className="bg-slate-900/90 border border-red-500/30 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 font-medium">Fraud Probability</span>
                <p className="text-3xl font-black font-mono text-red-400">
                  {(result.probability * 100).toFixed(2)}%
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Decision Threshold</span>
                <p className="text-sm font-bold font-mono text-sky-400">90.00% (0.90)</p>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 inline-block mt-1">
                  CRITICAL RISK
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-mono space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between">
                <span>Prediction ID:</span>
                <span className="text-sky-300">{result.prediction_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="text-white font-bold">{result.features_used.type_TRANSFER ? 'TRANSFER' : 'CASH_OUT'}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="text-white font-bold">${result.features_used.amount?.toLocaleString()}</span>
              </div>
            </div>

            {/* Simulated Action Banner */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Recommended Action: Automated hold applied. Manual review required by Security Operations Center.
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                if (onInvestigate) onInvestigate();
                onClose();
              }}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-red-950/50"
            >
              <FileSearch className="w-4 h-4" /> Deep Forensics
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition"
            >
              Acknowledge
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
