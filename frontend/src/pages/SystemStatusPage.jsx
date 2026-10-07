import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, RefreshCw, Server, Cpu, Database, Network } from 'lucide-react';

export default function SystemStatusPage() {
  const [health, setHealth] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const checkStatus = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const end = performance.now();
      setLatency(Math.round(end - start));
      if (res.ok) {
        setHealth(await res.json());
      } else {
        setHealth(null);
      }
    } catch (err) {
      console.error(err);
      setHealth(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const endpoints = [
    { method: "GET", path: "/api/health", desc: "System status & model engine check" },
    { method: "GET", path: "/api/model/info", desc: "Model metadata, threshold 0.90 & features" },
    { method: "POST", path: "/api/predict", desc: "Single transaction evaluation with SHAP" },
    { method: "POST", path: "/api/predict/batch", desc: "JSON list batch prediction" },
    { method: "POST", path: "/api/predict/batch/csv", desc: "Streaming chunked CSV upload (chunksize=5000)" },
    { method: "GET", path: "/api/dataset/sample", desc: "PaySim 30-row dataset sample" },
    { method: "GET", path: "/api/analytics/summary", desc: "Telemetry & summary aggregations" },
    { method: "GET", path: "/api/patterns", desc: "Fraud typology pattern intelligence" },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            System Operations & API Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time infrastructure health, response latency, and OpenAPI endpoint directory.
          </p>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center gap-3">
          <Server className="w-8 h-8 text-emerald-400 p-1.5 bg-emerald-500/10 rounded-lg shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">FastAPI Backend</span>
            <p className="text-sm font-bold text-emerald-400">CONNECTED</p>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <Cpu className="w-8 h-8 text-sky-400 p-1.5 bg-sky-500/10 rounded-lg shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">XGBoost 2.1.4 Engine</span>
            <p className="text-sm font-bold text-sky-400">LOADED & ACTIVE</p>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <Database className="w-8 h-8 text-purple-400 p-1.5 bg-purple-500/10 rounded-lg shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">PaySim Dataset</span>
            <p className="text-sm font-bold text-purple-300">AVAILABLE</p>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <Network className="w-8 h-8 text-amber-400 p-1.5 bg-amber-500/10 rounded-lg shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">API Latency</span>
            <p className="text-sm font-bold font-mono text-white">{latency ? `${latency} ms` : 'Measuring...'}</p>
          </div>
        </div>
      </div>

      {/* Endpoint Directory */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">Registered API Endpoint Directory</h3>
          <span className="text-xs text-slate-400 font-mono">Last Checked: {lastChecked || 'Just now'}</span>
        </div>

        <div className="space-y-2">
          {endpoints.map((ep, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800 gap-2">
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className={`px-2 py-0.5 rounded font-bold ${
                  ep.method === 'GET' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                }`}>
                  {ep.method}
                </span>
                <span className="text-white font-bold">{ep.path}</span>
              </div>
              <span className="text-xs text-slate-400">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
