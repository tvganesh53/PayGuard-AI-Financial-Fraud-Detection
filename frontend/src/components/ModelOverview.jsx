import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, Check, Layers, Sliders, Activity } from 'lucide-react';

export default function ModelOverview() {
  const [modelInfo, setModelInfo] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [infoRes, healthRes] = await Promise.all([
          fetch('/api/model/info'),
          fetch('/api/health')
        ]);
        if (infoRes.ok) setModelInfo(await infoRes.json());
        if (healthRes.ok) setHealth(await healthRes.json());
      } catch (err) {
        console.error("Error fetching model info:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <Cpu className="w-8 h-8 text-sky-400 p-1.5 bg-sky-500/10 rounded-lg" />
            <div>
              <span className="text-xs font-medium text-slate-400">Architecture</span>
              <h3 className="text-lg font-bold text-white">{modelInfo?.model_type || "XGBoost"}</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Leakage-safe temporal tree model trained on PaySim transaction logs.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <Sliders className="w-8 h-8 text-purple-400 p-1.5 bg-purple-500/10 rounded-lg" />
            <div>
              <span className="text-xs font-medium text-slate-400">Decision Threshold</span>
              <h3 className="text-lg font-bold text-purple-300">0.90 (Fixed)</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Strict threshold optimized to maximize precision on high-risk transfers.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-emerald-400 p-1.5 bg-emerald-500/10 rounded-lg" />
            <div>
              <span className="text-xs font-medium text-slate-400">Engine Health</span>
              <h3 className="text-lg font-bold text-emerald-400">XGBoost {modelInfo?.xgboost_version || "2.1.4"}</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Model validation & environment schema active.
          </p>
        </div>
      </div>

      {/* Feature Schema */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-400" />
          Production Model Feature Vector (10 Features)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modelInfo?.features.map((feat, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/80 border border-slate-700/50 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 font-mono text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <div className="font-mono text-xs text-slate-200">
                {feat}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
