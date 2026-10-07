import React from 'react';
import { Play, Database, Sliders, Cpu, Scale, ShieldCheck } from 'lucide-react';

export default function FraudTimeline({ isFraud, probability, threshold = 0.90 }) {
  const steps = [
    { title: "Transaction Event", desc: "Raw input payload received", icon: Play, color: "text-sky-400" },
    { title: "Feature Extraction", desc: "10 features formatted", icon: Database, color: "text-indigo-400" },
    { title: "Ratio Engineering", desc: "Calculates leakage-safe ratios", icon: Sliders, color: "text-purple-400" },
    { title: "XGBoost 2.1.4 Engine", desc: "300 trees produce logit score", icon: Cpu, color: "text-cyan-400" },
    { title: `Threshold (0.90)`, desc: `Score: ${(probability*100).toFixed(2)}% vs 90.00%`, icon: Scale, color: "text-amber-400" },
    { title: "Risk Decision", desc: isFraud ? "FRAUD DETECTED" : "LEGITIMATE", icon: ShieldCheck, color: isFraud ? "text-red-400" : "text-emerald-400" },
  ];

  return (
    <div className="glass-panel p-6 space-y-4">
      <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
        <Cpu className="w-5 h-5 text-sky-400" />
        Sequential Model Evaluation Timeline
      </h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {steps.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} className="relative flex items-start gap-4 group">
              <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:border-sky-500 transition">
                <Icon className={`w-3 h-3 ${st.color}`} />
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 w-full hover:border-slate-700 transition">
                <h4 className="text-xs font-bold text-white flex items-center justify-between">
                  <span>{st.title}</span>
                  <span className="text-[10px] font-mono text-slate-500">Stage {i+1}</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{st.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
