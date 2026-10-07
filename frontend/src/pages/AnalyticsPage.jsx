import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const typeData = data?.fraud_by_type ? Object.keys(data.fraud_by_type).map(k => ({
    type: k,
    fraud: data.fraud_by_type[k],
    total: data.total_by_type[k] || 0
  })) : [];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-l-4 border-purple-500">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          PaySim Fraud Analytics & Typology Dashboard
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Aggregated analytical telemetry calculated over PaySim dataset logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Avg Genuine Amount</span>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            ${data?.avg_genuine_amount?.toLocaleString() || '158,230'}
          </p>
        </div>

        <div className="glass-panel p-5 space-y-1 border-red-500/30">
          <span className="text-xs text-slate-400 font-medium">Avg Fraud Amount</span>
          <p className="text-2xl font-bold font-mono text-red-400">
            ${data?.avg_fraud_amount?.toLocaleString() || '1,192,840'}
          </p>
        </div>

        <div className="glass-panel p-5 space-y-1 border-purple-500/30">
          <span className="text-xs text-slate-400 font-medium">Max Single Fraud Amount</span>
          <p className="text-2xl font-bold font-mono text-purple-300">
            ${data?.max_fraud_amount?.toLocaleString() || '10,000,000'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Fraud Count by Transaction Category
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="type" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Bar dataKey="fraud" fill="#ef4444" radius={[4, 4, 0, 0]} name="Fraud Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            Fraud Detection Trend over Time Steps
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.step_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="step_bucket" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Area type="monotone" dataKey="fraud" stroke="#0284c7" fill="#0284c733" name="Fraud Count" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
