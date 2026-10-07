import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, RefreshCw, ShieldAlert, ShieldCheck, Activity, BarChart2 } from 'lucide-react';
import { getAnalytics, getModelInfo, getPredictionHistory } from '../services/api';

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportDate, setReportDate] = useState(new Date().toLocaleString());

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, infoData, historyData] = await Promise.all([
        getAnalytics().catch(() => null),
        getModelInfo().catch(() => null),
        getPredictionHistory({ limit: 50 }).catch(() => ({ items: [] }))
      ]);

      setAnalytics(analyticsData);
      setModelInfo(infoData);
      setHistory(historyData?.items || []);
      setReportDate(new Date().toLocaleString());
    } catch (err) {
      setError(err.message || 'Failed to generate executive report.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!history || history.length === 0) return;

    const headers = ["Prediction_ID", "Timestamp", "Transaction_Type", "Amount", "Probability", "Is_Fraud", "Risk_Level", "Threshold"];
    const rows = history.map(item => [
      item.prediction_id,
      item.timestamp,
      item.transaction_type || item.type,
      item.amount,
      item.probability,
      item.is_fraud ? 1 : 0,
      item.risk_level,
      item.threshold || 0.90
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payguard_audit_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Non-printable Action Controls Header */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <span className="font-display text-[11px] font-bold px-2.5 py-1 rounded bg-[#1f2937] text-emerald-400 uppercase tracking-widest inline-block mb-1 border border-[#374151]">
            EXECUTIVE REPORTING WORKSPACE
          </span>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white uppercase tracking-wide">
            Financial Fraud Audit & Compliance Report
          </h2>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Generate, print, or export executive fraud investigation reports with dynamic SQLite audit data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadReportData}
            disabled={loading}
            className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-200 text-xs font-display font-bold rounded-lg border border-[#374151] flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-200 text-xs font-display font-bold rounded-lg border border-[#374151] flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-display font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <Printer className="w-4 h-4" /> PRINT REPORT
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono print:hidden">
          {error}
        </div>
      )}

      {/* Printable Report Document Body */}
      <div id="printable-report" className="fintech-card p-8 space-y-8 print:bg-white print:text-black print:p-0 print:border-none">
        
        {/* Document Header */}
        <div className="border-b border-[#1f2937] print:border-black pb-6 flex justify-between items-start">
          <div>
            <h1 className="font-display font-black text-2xl text-white print:text-black uppercase tracking-wider">
              PAYGUARD <span className="text-emerald-400 print:text-black">AI</span> FINANCIAL FRAUD REPORT
            </h1>
            <p className="font-sans text-xs text-slate-400 print:text-gray-600 mt-1">
              Confidential Financial Security & Audit Intelligence Log
            </p>
          </div>

          <div className="text-right font-mono text-xs text-slate-400 print:text-gray-800">
            <div>Report Generated: <strong className="text-slate-200 print:text-black">{reportDate}</strong></div>
            <div>Classification: <strong className="text-emerald-400 print:text-black">INTERNAL AUDIT</strong></div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 print:text-gray-800">
            1. Executive Audit Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 bg-[#0b0f19] print:bg-gray-100 border border-[#1f2937] print:border-gray-300 rounded-lg">
              <span className="text-slate-500 print:text-gray-600 block text-[11px] font-sans">Total Audited Transactions</span>
              <span className="text-xl font-bold text-white print:text-black mt-1 block">
                {analytics?.total_predictions || 0}
              </span>
            </div>
            <div className="p-4 bg-[#0b0f19] print:bg-gray-100 border border-[#1f2937] print:border-gray-300 rounded-lg">
              <span className="text-slate-500 print:text-gray-600 block text-[11px] font-sans">Total Fraud Flagged</span>
              <span className="text-xl font-bold text-red-400 print:text-red-700 mt-1 block">
                {analytics?.fraud_detected || 0}
              </span>
            </div>
            <div className="p-4 bg-[#0b0f19] print:bg-gray-100 border border-[#1f2937] print:border-gray-300 rounded-lg">
              <span className="text-slate-500 print:text-gray-600 block text-[11px] font-sans">Overall Fraud Rate</span>
              <span className="text-xl font-bold text-amber-400 print:text-amber-700 mt-1 block">
                {analytics?.fraud_rate !== undefined ? `${(analytics.fraud_rate * 100).toFixed(2)}%` : '0.00%'}
              </span>
            </div>
            <div className="p-4 bg-[#0b0f19] print:bg-gray-100 border border-[#1f2937] print:border-gray-300 rounded-lg">
              <span className="text-slate-500 print:text-gray-600 block text-[11px] font-sans">Critical Risk Incidents</span>
              <span className="text-xl font-bold text-red-500 print:text-red-800 mt-1 block">
                {analytics?.risk_distribution?.CRITICAL || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Deployed Engine Specs */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 print:text-gray-800">
            2. Production Model Verification
          </h3>
          <div className="p-4 bg-[#0b0f19] print:bg-gray-100 border border-[#1f2937] print:border-gray-300 rounded-lg text-xs font-mono grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-500 print:text-gray-600 block text-[10px]">Algorithm</span>
              <span className="font-bold text-white print:text-black">XGBoost (Class Weight)</span>
            </div>
            <div>
              <span className="text-slate-500 print:text-gray-600 block text-[10px]">Production Threshold</span>
              <span className="font-bold text-emerald-400 print:text-emerald-700">0.90 (90.00%)</span>
            </div>
            <div>
              <span className="text-slate-500 print:text-gray-600 block text-[10px]">Precision / Recall</span>
              <span className="font-bold text-slate-200 print:text-black">86.20% / 99.48%</span>
            </div>
            <div>
              <span className="text-slate-500 print:text-gray-600 block text-[10px]">F1-Score / AUPRC</span>
              <span className="font-bold text-slate-200 print:text-black">92.36% / 0.9833</span>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 print:text-gray-800">
            3. Transaction Audit Trail (Last {history.length} Events)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1f2937]/50 print:bg-gray-200 text-slate-400 print:text-black font-display font-bold uppercase text-[10px] tracking-wider border-b border-[#1f2937] print:border-black">
                <tr>
                  <th className="px-3 py-2">Prediction ID</th>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Probability</th>
                  <th className="px-3 py-2">Risk</th>
                  <th className="px-3 py-2">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937] print:divide-gray-300 font-mono text-[11px]">
                {history.map((item, idx) => {
                  const prob = typeof item.probability === 'number' ? item.probability : parseFloat(item.probability) || 0;
                  const isFraud = item.is_fraud ?? (prob >= 0.90);
                  const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0;
                  return (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-slate-200 print:text-black font-bold">{item.prediction_id}</td>
                      <td className="px-3 py-2 text-slate-400 print:text-gray-700">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-white print:text-black">{item.transaction_type || item.type}</td>
                      <td className="px-3 py-2 text-slate-100 print:text-black">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`px-3 py-2 font-bold ${isFraud ? 'text-red-400 print:text-red-700' : 'text-emerald-400 print:text-emerald-700'}`}>
                        {(prob * 100).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-slate-300 print:text-black">{item.risk_level}</td>
                      <td className="px-3 py-2 font-bold">
                        {isFraud ? 'FRAUD' : 'LEGITIMATE'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Authorization */}
        <div className="pt-6 border-t border-[#1f2937] print:border-black flex justify-between items-center text-[10px] font-mono text-slate-500 print:text-gray-600">
          <span>PAYGUARD AI SECURITY OPERATIONS CENTER &bull; AUTOMATED SYSTEM AUDIT</span>
          <span>PAGE 1 OF 1</span>
        </div>

      </div>
    </div>
  );
}
