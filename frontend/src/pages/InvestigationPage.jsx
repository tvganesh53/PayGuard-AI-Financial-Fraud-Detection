import React, { useState, useEffect } from 'react';
import { 
  FileSearch, Search, RefreshCw, AlertTriangle, ShieldCheck, 
  ShieldAlert, Activity, ArrowRight, Layers, Copy, Check 
} from 'lucide-react';
import { getPrediction, predictTransaction, getModelInfo } from '../services/api';
import TransactionForensics from '../components/TransactionForensics';
import RiskSignals from '../components/RiskSignals';
import FeatureAnalysis from '../components/FeatureAnalysis';
import TransactionFlow from '../components/TransactionFlow';

export default function InvestigationPage({ initialRecord }) {
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getModelInfo().then(data => setModelInfo(data)).catch(() => null);

    if (initialRecord) {
      if (typeof initialRecord === 'string') {
        fetchRecord(initialRecord);
      } else if (initialRecord.prediction_id) {
        fetchRecord(initialRecord.prediction_id);
      } else {
        setPredictionData(initialRecord);
      }
    } else {
      // Default fallback demo record
      runDefaultDemo();
    }
  }, [initialRecord]);

  const fetchRecord = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const record = await getPrediction(id);
      setPredictionData(record);
    } catch (err) {
      setError(err.message || `Failed to fetch prediction record '${id}'`);
    } finally {
      setLoading(false);
    }
  };

  const runDefaultDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const demoInput = {
        step: 1,
        type: "TRANSFER",
        amount: 181000.0,
        nameOrig: "C1305486145",
        oldbalanceOrg: 181000.0,
        newbalanceOrig: 0.0,
        nameDest: "C553264065",
        oldbalanceDest: 0.0,
        newbalanceDest: 0.0
      };
      const result = await predictTransaction(demoInput);
      setPredictionData(result);
    } catch (err) {
      setError(err.message || "Failed to load default investigation scenario.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (predictionData && predictionData.prediction_id) {
      navigator.clipboard.writeText(predictionData.prediction_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const prob = predictionData ? (typeof predictionData.probability === 'number' ? predictionData.probability : parseFloat(predictionData.probability) || 0) : 0;
  const isFraud = predictionData ? (predictionData.is_fraud ?? (prob >= 0.90)) : false;
  const amount = predictionData ? (typeof predictionData.amount === 'number' ? predictionData.amount : parseFloat(predictionData.amount) || 0) : 0;
  const riskLevel = predictionData?.risk_level || (isFraud ? 'CRITICAL' : 'LOW');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-display text-[11px] font-bold px-2.5 py-1 rounded bg-[#1f2937] text-[#10b981] uppercase tracking-widest inline-block mb-1 border border-[#374151]">
            FORENSIC INVESTIGATION WORKSPACE
          </span>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white uppercase tracking-wide">
            Transaction Case # {predictionData?.prediction_id || 'ANALYSIS'}
          </h2>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Deep-dive audit log analysis, feature contributions, rule signals, and SHAP decision explanations.
          </p>
        </div>

        <button
          onClick={runDefaultDemo}
          disabled={loading}
          className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] text-slate-200 text-xs font-display font-bold rounded-lg border border-[#374151] flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Load Case Scenario</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {predictionData && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="fintech-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1f2937] pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg border ${
                  isFraud ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isFraud ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                    <span>ID: {predictionData.prediction_id}</span>
                    <button onClick={handleCopyId} className="p-1 hover:bg-[#1f2937] rounded">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-wide">
                    {isFraud ? "FRAUDULENT TRANSACTION" : "CLEARED / LEGITIMATE"}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border ${
                  riskLevel === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                  riskLevel === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                  riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {riskLevel} RISK LEVEL
                </span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono pt-2">
              <div className="p-3 bg-[#0b0f19] border border-[#1f2937] rounded-lg">
                <span className="text-slate-500 block font-sans text-[11px]">Fraud Probability</span>
                <span className={`text-lg font-bold ${isFraud ? 'text-red-400' : 'text-emerald-400'}`}>
                  {(prob * 100).toFixed(2)}%
                </span>
              </div>
              <div className="p-3 bg-[#0b0f19] border border-[#1f2937] rounded-lg">
                <span className="text-slate-500 block font-sans text-[11px]">Production Threshold</span>
                <span className="text-lg font-bold text-slate-100">90.00% (0.90)</span>
              </div>
              <div className="p-3 bg-[#0b0f19] border border-[#1f2937] rounded-lg">
                <span className="text-slate-500 block font-sans text-[11px]">Transaction Amount</span>
                <span className="text-lg font-bold text-white">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 bg-[#0b0f19] border border-[#1f2937] rounded-lg">
                <span className="text-slate-500 block font-sans text-[11px]">Transaction Type</span>
                <span className="text-lg font-bold text-emerald-400">{predictionData.transaction_type || predictionData.type || 'TRANSFER'}</span>
              </div>
            </div>
          </div>

          {/* Risk Signals */}
          {predictionData.risk_signals && (
            <RiskSignals signals={predictionData.risk_signals} />
          )}

          {/* Transaction Forensics Inputs */}
          <TransactionForensics
            features={predictionData.features_used || predictionData}
            txInput={predictionData}
          />

          {/* SHAP Feature Analysis */}
          {predictionData.shap_values && (
            <FeatureAnalysis
              globalImportances={modelInfo?.global_feature_importances}
              shapValues={predictionData.shap_values}
              shapBaseValue={predictionData.shap_base_value}
            />
          )}

          {/* Flow Path */}
          <TransactionFlow
            txData={predictionData}
            isFraud={isFraud}
            riskLevel={riskLevel}
          />
        </div>
      )}
    </div>
  );
}
