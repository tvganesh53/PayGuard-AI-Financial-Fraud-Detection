import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertOctagon, Filter, RefreshCw, BarChart2, Eye } from 'lucide-react';
import TransactionDrawer from './TransactionDrawer';

export default function BatchScanner({ onSelectTransaction }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/predict/batch/csv', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || `Upload failed with status ${response.status}`);
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to process CSV file batch prediction.');
    } finally {
      setLoading(false);
    }
  };

  const openRowDrawer = (row) => {
    setSelectedTx(row);
    setDrawerOpen(true);
  };

  const filteredPredictions = results ? results.predictions.filter(p => {
    if (filterRisk === 'ALL') return true;
    if (filterRisk === 'FRAUD') return p.is_fraud;
    return p.risk_level === filterRisk;
  }) : [];

  return (
    <div className="space-y-6">
      {/* Transaction Forensic Drawer */}
      <TransactionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        transactionData={selectedTx}
        onInvestigate={onSelectTransaction}
      />

      {/* File Upload Box */}
      <div className="glass-panel p-6 shadow-xl">
        <h2 className="font-display font-extrabold text-xl text-white mb-1 flex items-center gap-2 uppercase tracking-wider">
          <Upload className="w-5 h-5 text-sky-400" />
          STREAMING CHUNKED BATCH SCANNER
        </h2>
        <p className="font-sans italic text-xs text-slate-400 mb-6">
          Upload any PaySim transaction CSV. Processed in streaming 5,000-row chunks without memory overhead.
        </p>

        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-4 items-center">
          <label className="flex-1 w-full flex items-center gap-3 px-4 py-3 bg-slate-950 border border-dashed border-slate-700 hover:border-sky-500 rounded-xl cursor-pointer transition">
            <FileText className="w-5 h-5 text-sky-400 shrink-0" />
            <span className="font-mono text-xs text-slate-300 truncate">
              {file ? file.name : "Select or drag & drop CSV file..."}
            </span>
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full sm:w-auto px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-display font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shrink-0 uppercase tracking-wider"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Processing Chunks...
              </>
            ) : (
              "Scan Batch CSV"
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl font-mono text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {results && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5">
              <span className="font-display text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Scanned</span>
              <p className="font-mono text-3xl font-black text-white mt-1">{results.total_transactions.toLocaleString()}</p>
            </div>

            <div className="glass-panel p-5 border-red-500/40">
              <span className="font-display text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fraud Flagged (&ge; 0.90)</span>
              <p className="font-mono text-3xl font-black text-red-400 mt-1">{results.total_fraud_detected.toLocaleString()}</p>
            </div>

            <div className="glass-panel p-5 border-amber-500/40">
              <span className="font-display text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fraud Rate</span>
              <p className="font-mono text-3xl font-black text-amber-400 mt-1">{results.fraud_rate_percentage}%</p>
            </div>

            <div className="glass-panel p-5 border-purple-500/40">
              <span className="font-display text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical Risk Count</span>
              <p className="font-mono text-3xl font-black text-purple-300 mt-1">{results.risk_distribution.CRITICAL || 0}</p>
            </div>
          </div>

          {/* Table & Filters */}
          <div className="glass-panel p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-3">
              <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2 uppercase tracking-wider">
                <BarChart2 className="w-5 h-5 text-sky-400" />
                BATCH INFERENCES PREVIEW
              </h3>

              <div className="flex items-center gap-2 text-xs font-sans">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 font-medium">Filter:</span>
                {['ALL', 'FRAUD', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setFilterRisk(lvl)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      filterRisk === lvl ? 'bg-sky-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-display font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3">Row</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Probability</th>
                    <th className="px-3 py-3">Risk Level</th>
                    <th className="px-3 py-3">Decision</th>
                    <th className="px-3 py-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPredictions.map((row) => (
                    <tr 
                      key={row.prediction_id} 
                      onClick={() => openRowDrawer(row)}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                    >
                      <td className="px-3 py-2.5 text-slate-400">#{row.row_index + 1}</td>
                      <td className="px-3 py-2.5 font-bold text-white">{row.type}</td>
                      <td className="px-3 py-2.5 text-sky-400 font-bold">${row.amount.toLocaleString()}</td>
                      <td className="px-3 py-2.5 font-bold">{(row.probability * 100).toFixed(2)}%</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          row.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                          row.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {row.risk_level}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold">
                        {row.is_fraud ? (
                          <span className="text-red-400 flex items-center gap-1">
                            <AlertOctagon className="w-3.5 h-3.5" /> FRAUD
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> LEGIT
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPredictions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500 font-sans italic">
                        No transactions match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
