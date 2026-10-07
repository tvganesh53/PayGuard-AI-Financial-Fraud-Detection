import React from 'react';
import { motion } from 'framer-motion';

export default function FraudGauge({ probability, threshold = 0.90, isFraud, riskLevel }) {
  const probPercent = (probability * 100).toFixed(2);
  const threshPercent = (threshold * 100).toFixed(0);

  const getPointerRotation = (prob) => {
    return -90 + (prob * 180);
  };

  const getGaugeColor = (prob) => {
    if (prob >= 0.90) return '#ef4444';
    if (prob >= 0.70) return '#f97316';
    if (prob >= 0.30) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 border border-slate-800 rounded-2xl relative overflow-hidden shadow-2xl">
      <div 
        className="absolute w-48 h-48 rounded-full blur-3xl opacity-20 -top-10 transition-all duration-700"
        style={{ backgroundColor: getGaugeColor(probability) }}
      />

      <span className="font-display text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
        FRAUD PROBABILITY SCORE
      </span>

      {/* Semi-Circle SVG Gauge */}
      <div className="relative w-64 h-36 flex items-end justify-center">
        <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="16"
            strokeLinecap="round"
          />

          <line
            x1="100"
            y1="100"
            x2="164.8"
            y2="53"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="3 3"
          />

          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={getGaugeColor(probability)}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="251.2"
            initial={{ strokeDashoffset: 251.2 }}
            animate={{ strokeDashoffset: 251.2 - (probability * 251.2) }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          <motion.g
            initial={{ rotate: -90 }}
            animate={{ rotate: getPointerRotation(probability) }}
            transition={{ duration: 1.2, type: "spring", stiffness: 60 }}
            style={{ transformOrigin: "100px 100px" }}
          >
            <polygon points="96,100 104,100 100,28" fill="#ffffff" />
            <circle cx="100" cy="100" r="8" fill="#0f172a" stroke="#ffffff" strokeWidth="3" />
          </motion.g>
        </svg>

        <div className="absolute bottom-0 text-center">
          <motion.span 
            className="text-4xl font-black font-mono tracking-tight text-white block"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {probPercent}%
          </motion.span>
        </div>
      </div>

      <div className="w-full flex justify-between items-center text-xs mt-6 pt-4 border-t border-slate-800 text-slate-400">
        <div className="flex flex-col items-start font-mono">
          <span className="text-[10px] text-slate-500">0.00%</span>
          <span className="font-bold text-emerald-400">LOW</span>
        </div>

        <div className="flex flex-col items-center bg-slate-800/80 px-3 py-1 rounded-xl border border-sky-500/30">
          <span className="font-display text-[10px] text-sky-400 font-bold uppercase tracking-wider">DECISION THRESHOLD</span>
          <span className="font-mono font-bold text-white text-xs">{threshPercent}.00% (0.90)</span>
        </div>

        <div className="flex flex-col items-end font-mono">
          <span className="text-[10px] text-slate-500">100.00%</span>
          <span className="font-bold text-red-400">CRITICAL</span>
        </div>
      </div>
    </div>
  );
}
