import React, { useState, useEffect } from 'react';
import { 
  ListFilter, Search, RefreshCw, ChevronLeft, ChevronRight, 
  ShieldAlert, ShieldCheck, Filter, AlertTriangle 
} from 'lucide-react';
import { getPredictionHistory } from '../services/api';

export default function PredictionHistoryPage({ onSelectTransaction }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [isFraudFilter, setIsFraudFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [isFraudFilter, riskFilter, typeFilter, limit, offset]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit,
        offset,
        is_fraud: isFraudFilter === '' ? null : isFraudFilter === 'true',
        risk_level: riskFilter || null,
        transaction_type: typeFilter || null
      };
      const data = await getPredictionHistory(params);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to query prediction history from SQLite.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.prediction_id && item.prediction_id.toLowerCase().includes(term)) ||
      (item.transaction_type && item.transaction_type.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl text-white uppercase tracking-wide flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-emerald-400" />
            Transaction Audit Trail
          </h2>
          <p className="font-sans text-xs text-slate-400 mt-1">
            SQLite persistent prediction history logged post-inference with duplicate prevention.
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-200 text-xs font-display font-bold rounded-lg border border-[#374151] flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Table</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Search */}
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-[#0b0f19] px-3 py-2 rounded-lg border border-[#1f2937]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search prediction ID or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white focus:outline-none w-full font-mono"
            />
          </div>

          {/* Fraud Filter */}
          <select
            value={isFraudFilter}
            onChange={(e) => { setIsFraudFilter(e.target.value); setOffset(0); }}
            className="bg-[#0b0f19] border border-[#1f2937] text-white rounded-lg px-3 py-2 font-mono"
          >
            <option value="">All Outcomes</option>
            <option value="true">Fraud Only</option>
            <option value="false">Legitimate Only</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setOffset(0); }}
            className="bg-[#0b0f19] border border-[#1f2937] text-white rounded-lg px-3 py-2 font-mono"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">CRITICAL Risk</option>
            <option value="HIGH">HIGH Risk</option>
            <option value="MEDIUM">MEDIUM Risk</option>
            <option value="LOW">LOW Risk</option>
          </select>

          {/* Category Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setOffset(0); }}
            className="bg-[#0b0f19] border border-[#1f2937] text-white rounded-lg px-3 py-2 font-mono"
          >
            <option value="">All Categories</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="CASH_OUT">CASH_OUT</option>
            <option value="PAYMENT">PAYMENT</option>
            <option value="DEBIT">DEBIT</option>
            <option value="CASH_IN">CASH_IN</option>
          </select>

          {/* Limit Per Page */}
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
            className="bg-[#0b0f19] border border-[#1f2937] text-white rounded-lg px-3 py-2 font-mono"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Main Table */}
      <div className="fintech-card p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#1f2937]/50 text-slate-400 font-display font-bold uppercase text-[10px] tracking-wider border-b border-[#1f2937]">
              <tr>
                <th className="px-3 py-2.5">Prediction ID</th>
                <th className="px-3 py-2.5">Timestamp</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Amount</th>
                <th className="px-3 py-2.5">Probability</th>
                <th className="px-3 py-2.5">Decision</th>
                <th className="px-3 py-2.5">Risk Level</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]">
              {filteredItems.map((item, idx) => {
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
                    <td className="px-3 py-2.5 text-right font-display text-emerald-400 hover:text-white font-semibold text-[11px]">
                      Drawer &rarr;
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 font-sans">
                    No matching audit history records found in SQLite database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-[#1f2937] text-xs font-mono text-slate-400">
          <span>
            Showing records {total > 0 ? offset + 1 : 0} – {Math.min(total, offset + limit)} of {total} total
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={offset === 0 || loading}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="px-3 py-1.5 bg-[#111827] border border-[#1f2937] rounded hover:bg-[#1f2937] disabled:opacity-50 text-slate-200 transition"
            >
              <ChevronLeft className="w-4 h-4 inline" /> Prev
            </button>

            <span className="px-2">Page {currentPage} of {totalPages}</span>

            <button
              disabled={offset + limit >= total || loading}
              onClick={() => setOffset(offset + limit)}
              className="px-3 py-1.5 bg-[#111827] border border-[#1f2937] rounded hover:bg-[#1f2937] disabled:opacity-50 text-slate-200 transition"
            >
              Next <ChevronRight className="w-4 h-4 inline" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
