import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Play, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import TransactionDrawer from './TransactionDrawer';

export default function DatasetExplorer({ onSelectRecord }) {
  const [sampleData, setSampleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dataset/sample');
      if (!response.ok) {
        throw new Error('Failed to fetch dataset sample');
      }
      const data = await response.json();
      setSampleData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSample();
  }, []);

  const openRowDrawer = (row) => {
    setSelectedTx(row);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Forensic Drawer */}
      <TransactionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        transactionData={selectedTx}
        onInvestigate={onSelectRecord}
      />

      <div className="glass-panel p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-display font-extrabold text-xl text-white flex items-center gap-2 uppercase tracking-wider">
              <Database className="w-5 h-5 text-sky-400" />
              PAYSIM LOGS EXPLORER
            </h2>
            <p className="font-sans italic text-xs text-slate-400 mt-1">
              Sample records loaded directly from <code className="text-sky-300 font-mono">data/paysim.csv</code> (30-row memory-safe sample).
            </p>
          </div>

          <button
            onClick={fetchSample}
            disabled={loading}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold rounded-xl flex items-center gap-1.5 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-mono text-red-400">
            {error}
          </div>
        )}

        {sampleData && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-display font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3">Inspect</th>
                  <th className="px-3 py-3">Step</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Origin Account</th>
                  <th className="px-3 py-3">Old Bal Org</th>
                  <th className="px-3 py-3">Dest Account</th>
                  <th className="px-3 py-3">Old Bal Dest</th>
                  <th className="px-3 py-3">Actual Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sampleData.data.map((row, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => openRowDrawer(row)}
                    className="hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="px-3 py-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectRecord) onSelectRecord(row);
                        }}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-sans font-bold flex items-center gap-1 transition"
                      >
                        <Play className="w-3 h-3" /> Test
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">#{row.step}</td>
                    <td className="px-3 py-2.5 font-bold text-white">{row.type}</td>
                    <td className="px-3 py-2.5 text-sky-400 font-bold">${row.amount?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-slate-400 truncate max-w-[110px]">{row.nameOrig}</td>
                    <td className="px-3 py-2.5">${row.oldbalanceOrg?.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-slate-400 truncate max-w-[110px]">{row.nameDest}</td>
                    <td className="px-3 py-2.5">${row.oldbalanceDest?.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      {row.isFraud === 1 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" /> FRAUD (1)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> LEGIT (0)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
