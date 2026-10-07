import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, ArrowRight, Building, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function TransactionFlow({ txData, isFraud, riskLevel }) {
  if (!txData) return null;

  const flowColor = isFraud ? '#ef4444' : (riskLevel === 'HIGH' ? '#f59e0b' : '#10b981');

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-sky-400" />
          Interactive Money Flow Architecture
        </h3>
        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
          isFraud ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
        }`}>
          {isFraud ? 'SUSPICIOUS MONEY DRAIN' : 'NORMAL FUNDS TRANSFER'}
        </span>
      </div>

      {/* Visual Money Flow Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative py-4">
        
        {/* Node 1: Origin Account */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 relative z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/30">
              <UserCheck className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono">ORIGIN SENDER</span>
              <h4 className="text-xs font-bold text-white font-mono">{txData.nameOrig || 'Sender Account'}</h4>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
            <span className="text-slate-400">Initial Balance:</span>
            <span className="font-mono font-bold text-white">${txData.oldbalanceOrg?.toLocaleString()}</span>
          </div>
        </div>

        {/* Node 2: Transaction Gateway (Center) */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 relative z-10 shadow-lg flex flex-col items-center text-center">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest px-2.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/30">
            {txData.type || 'TRANSFER'}
          </span>
          <div className="my-1">
            <span className="text-2xl font-black font-mono" style={{ color: flowColor }}>
              ${txData.amount?.toLocaleString()}
            </span>
          </div>

          {/* Animated Flow Arrow */}
          <div className="w-full flex items-center justify-center my-2">
            <motion.div 
              className="h-1.5 rounded-full w-full relative overflow-hidden"
              style={{ backgroundColor: `${flowColor}33` }}
            >
              <motion.div
                className="h-full rounded-full w-1/3"
                style={{ backgroundColor: flowColor }}
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Step #{txData.step} Execution</span>
        </div>

        {/* Node 3: Destination Account */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 relative z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
              <Building className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono">DESTINATION RECEIVER</span>
              <h4 className="text-xs font-bold text-white font-mono">{txData.nameDest || 'Destination Account'}</h4>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
            <span className="text-slate-400">Initial Balance:</span>
            <span className="font-mono font-bold text-white">${txData.oldbalanceDest?.toLocaleString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
