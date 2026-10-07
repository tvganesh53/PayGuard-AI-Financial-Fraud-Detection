import React, { useState, useEffect } from 'react';
import { Menu, Activity, ShieldCheck, AlertCircle } from 'lucide-react';
import { getHealth } from '../services/api';

export default function TopBar({ activeTabTitle, setMobileOpen }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const data = await getHealth();
        if (isMounted) {
          setHealth(data);
          setConnected(true);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setConnected(false);
          setLoading(false);
        }
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="h-16 bg-[#0b0f19] border-b border-[#1f2937] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-lg bg-[#111827] border border-[#1f2937] text-slate-300"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-[11px] font-sans text-slate-400">
            <span>PayGuard AI</span>
            <span>/</span>
            <span className="text-slate-200 font-semibold">{activeTabTitle}</span>
          </div>
          <h2 className="font-display font-extrabold text-base text-white tracking-wide uppercase mt-0.5">{activeTabTitle}</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Backend Connection Badge using GET /api/health */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition ${
          loading ? 'bg-[#111827] text-slate-400 border-[#1f2937]' :
          connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
          'bg-red-500/10 text-red-400 border-red-500/30'
        }`}>
          {loading ? (
            <>
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : connected ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>API Connected (XGBoost 2.1.4 @ 0.90)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Backend Disconnected</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
