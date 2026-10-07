import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Activity, BarChart2, PieChart as PieIcon, 
  RefreshCw, TrendingUp, DollarSign, Layers, ArrowUpRight, AlertTriangle 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { getAnalytics, getPredictionHistory } from '../services/api';

export default function OverviewPage({ onSelectTransaction, onNavigateToScanner }) {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, historyData] = await Promise.all([
        getAnalytics().catch(() => null),
        getPredictionHistory({ limit: 10 }).catch(() => ({ items: [] }))
      ]);

      setAnalytics(analyticsData);
      setHistory(historyData?.items || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  // Recharts datasets
  const donutData = analytics ? [
    { name: 'Legitimate', value: analytics.legitimate_detected || 0, color: '#10b981' },
    { name: 'Fraud Detected', value: analytics.fraud_detected || 0, color: '#ef4444' }
  ] : [];

  const riskDistData = analytics && analytics.risk_distribution ? [
    { name: 'LOW', count: analytics.risk_distribution.LOW || 0, fill: '#10b981' },
    { name: 'MEDIUM', count: analytics.risk_distribution.MEDIUM || 0, fill: '#f59e0b' },
    { name: 'HIGH', count: analytics.risk_distribution.HIGH || 0, fill: '#f97316' },
    { name: 'CRITICAL', count: analytics.risk_distribution.CRITICAL || 0, fill: '#ef4444' }
  ] : [];

  // Transaction type breakdown derived from history items
  const typeMap = {};
  history.forEach(item => {
    const t = item.transaction_type || 'TRANSFER';
    typeMap[t] = (typeMap[t] || 0) + 1;
  });
  const typeData = Object.keys(typeMap).map(type => ({
    type,
    count: typeMap[type]
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-display text-[11px] font-bold px-2.5 py-1 rounded bg-[#1f2937] text-slate-300 uppercase tracking-widest inline-block mb-1 border border-[#374151]">
            FINANCIAL INTELLIGENCE OVERVIEW
          </span>
          <h1 className="font-display font-extrabold text-xl sm:text-2xl text-white tracking-wide uppercase">
            Fraud Risk & Model Performance
          </h1>
          <p className="font-sans text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Monitor real-time financial transaction streams, SQLite audit activity, and XGBoost fraud detections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-200 text-xs font-display font-bold rounded-lg border border-[#374151] flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onNavigateToScanner}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-display font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" /> SCAN TRANSACTION
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="underline hover:text-white">Retry</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="fintech-card p-4 space-y-1">
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            TOTAL PREDICTIONS
          </span>
          <p className="font-mono text-2xl font-bold text-white">
            {loading ? '...' : (analytics?.total_predictions?.toLocaleString() || '0')}
          </p>
          <span className="font-sans text-[10px] text-slate-500 block">SQLite Audit Log</span>
        </div>

        <div className="fintech-card p-4 space-y-1 border-red-500/40">
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            FRAUD DETECTED
          </span>
          <p className="font-mono text-2xl font-bold text-red-400">
            {loading ? '...' : (analytics?.fraud_detected?.toLocaleString() || '0')}
          </p>
          <span className="font-mono text-[10px] text-red-400/90 font-bold block">Threshold &ge; 90%</span>
        </div>

        <div className="fintech-card p-4 space-y-1 border-emerald-500/40">
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            LEGITIMATE
          </span>
          <p className="font-mono text-2xl font-bold text-emerald-400">
            {loading ? '...' : (analytics?.legitimate_detected?.toLocaleString() || '0')}
          </p>
          <span className="font-sans text-[10px] text-slate-500 block">Cleared Stream</span>
        </div>

        <div className="fintech-card p-4 space-y-1 border-amber-500/40">
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            FRAUD RATE
          </span>
          <p className="font-mono text-2xl font-bold text-amber-400">
            {loading ? '...' : (analytics?.fraud_rate !== undefined ? `${(analytics.fraud_rate * 100).toFixed(2)}%` : '0.00%')}
          </p>
          <span className="font-sans text-[10px] text-slate-500 block">Detected Ratio</span>
        </div>

        <div className="fintech-card p-4 space-y-1">
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            AVG FRAUD PROB
          </span>
          <p className="font-mono text-2xl font-bold text-sky-400">
            {loading ? '...' : (analytics?.average_fraud_probability !== undefined ? `${(analytics.average_fraud_probability * 100).toFixed(2)}%` : '0.00%')}
          </p>
          <span className="font-sans text-[10px] text-slate-500 block">Mean Score</span>
        </div>

        <div className="fintech-card p-4 space-y-1 border-red-500/50">
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            CRITICAL RISKS
          </span>
          <p className="font-mono text-2xl font-bold text-red-500">
            {loading ? '...' : (analytics?.risk_distribution?.CRITICAL || 0)}
          </p>
          <span className="font-mono text-[10px] text-red-400 font-bold block">Immediate Review</span>
        </div>
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Fraud vs Genuine Donut */}
        <div className="lg:col-span-4 fintech-card p-5 space-y-4">
          <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-400" />
            Class Distribution Ratio
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '0.5rem', color: '#fff', fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-around text-xs font-mono font-bold pt-2 border-t border-[#1f2937]">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Legitimate ({analytics?.legitimate_detected || 0})
            </span>
            <span className="text-red-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Fraud ({analytics?.fraud_detected || 0})
            </span>
          </div>
        </div>

        {/* Risk Level Distribution Bar Chart */}
        <div className="lg:col-span-8 fintech-card p-5 space-y-4">
          <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            Risk Classification Breakdown
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'Space Grotesk' }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '0.5rem', color: '#fff', fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                  {riskDistData.map((entry, index) => (
                    <Cell key={`risk-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Predictions Audit Table */}
      <div className="fintech-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Recent Prediction Log
          </h3>
          {lastUpdated && (
            <span className="font-mono text-[10px] text-slate-500">Last updated: {lastUpdated}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#1f2937]/50 text-slate-400 font-display font-bold uppercase text-[10px] tracking-wider border-b border-[#1f2937]">
              <tr>
                <th className="px-3 py-2.5">Prediction ID</th>
                <th className="px-3 py-2.5">Timestamp</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">Probability</th>
                <th className="px-3 py-2.5">Risk Level</th>
                <th className="px-3 py-2.5">Decision</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]">
              {history.map((item, idx) => {
                const prob = typeof item.probability === 'number' ? item.probability : parseFloat(item.probability) || 0;
                const isFraud = item.is_fraud ?? (prob >= 0.90);
                const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0;
                return (
                  <tr
                    key={idx}
                    onClick={() => onSelectTransaction && onSelectTransaction(item)}
                    className="hover:bg-[#1f2937]/40 transition cursor-pointer"
                  >
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-200">{item.prediction_id}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-white">{item.transaction_type || item.type}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-100">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`px-3 py-2.5 font-mono font-bold ${isFraud ? 'text-red-400' : 'text-emerald-400'}`}>
                      {(prob * 100).toFixed(2)}%
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        item.risk_level === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        item.risk_level === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                        item.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {item.risk_level}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-display font-bold">
                      {isFraud ? (
                        <span className="text-red-400 flex items-center gap-1 text-[11px]">
                          <ShieldAlert className="w-3.5 h-3.5" /> FRAUD
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" /> LEGITIMATE
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-display text-emerald-400 hover:text-white font-semibold text-[11px]">
                      Inspect &rarr;
                    </td>
                  </tr>
                );
              })}

              {!loading && history.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 font-sans">
                    No prediction history found. Run transactions in the Transaction Scanner to log audit events.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
