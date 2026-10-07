import React, { useState } from 'react';
import { LineChart, BarChart2, Layers, Image, CheckCircle, Info } from 'lucide-react';

const EXPERIMENT_RESULTS = [
  { model: "LR Baseline", precision: "1.0000", recall: "0.1365", f1: "0.2403", auprc: "0.3865", roc: "0.7686", threshold: "0.50", role: "Baseline" },
  { model: "LR ClassWeight", precision: "0.2881", recall: "0.3702", f1: "0.3240", auprc: "0.3695", roc: "0.8142", threshold: "0.50", role: "Experimental" },
  { model: "LR SMOTE", precision: "0.2431", recall: "0.3869", f1: "0.2986", auprc: "0.3552", roc: "0.8105", threshold: "0.50", role: "Experimental" },
  { model: "RF Baseline", precision: "1.0000", recall: "0.9965", f1: "0.9982", auprc: "0.9999", roc: "1.0000", threshold: "0.71", role: "Academic Benchmark" },
  { model: "RF ClassWeight", precision: "0.9997", recall: "0.9965", f1: "0.9981", auprc: "1.0000", roc: "1.0000", threshold: "0.71", role: "Experimental" },
  { model: "RF SMOTE", precision: "1.0000", recall: "0.9940", f1: "0.9970", auprc: "0.9999", roc: "0.9999", threshold: "0.71", role: "Experimental" },
  { model: "XGB Baseline", precision: "0.9869", recall: "0.7883", f1: "0.8765", auprc: "0.9832", roc: "0.9985", threshold: "0.50", role: "Baseline" },
  { model: "XGB ClassWeight", precision: "0.8620", recall: "0.9948", f1: "0.9236", auprc: "0.9833", roc: "0.9999", threshold: "0.90", role: "Production Deployed" },
  { model: "XGB SMOTE", precision: "0.9874", recall: "0.7239", f1: "0.8354", auprc: "0.9547", roc: "0.9980", threshold: "0.50", role: "Experimental" }
];

export default function ModelEvaluationPage() {
  const [selectedImage, setSelectedImage] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  const plots = [
    { title: "Precision-Recall Curves Comparison", filename: "pr_curves_comparison.png", desc: "PR curves demonstrating high area under PR curve for tree ensembles on imbalanced PaySim stream." },
    { title: "Threshold Optimization & Trade-Off", filename: "threshold_optimization.png", desc: "F1 score vs decision threshold curves locating optimal operational cutoffs." },
    { title: "Model Performance Comparison Matrix", filename: "model_performance_comparison.png", desc: "Comparative bar charts across Precision, Recall, F1, AUPRC, and ROC-AUC." },
    { title: "Confusion Matrices Grid", filename: "confusion_matrices.png", desc: "Full confusion matrix grid for 9 ML configurations evaluated on 918,617 test transactions." }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-display text-[11px] font-bold px-2.5 py-1 rounded bg-[#1f2937] text-emerald-400 uppercase tracking-widest inline-block mb-1 border border-[#374151]">
            PHASE 1 EXPERIMENTAL VERIFICATION
          </span>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white uppercase tracking-wide">
            Model Evaluation & Benchmarking
          </h2>
          <p className="font-sans text-xs text-slate-400 mt-1 max-w-2xl">
            Empirical comparative analysis across Logistic Regression, Random Forest, and XGBoost baseline, class-weight, and SMOTE configurations.
          </p>
        </div>
      </div>

      {/* 9-Experiment Benchmark Matrix Table */}
      <div className="fintech-card p-6 space-y-4">
        <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
          <LineChart className="w-4 h-4 text-emerald-400" />
          9-Experiment Evaluation Results Matrix (918,617 Test Transactions)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#1f2937]/50 text-slate-400 font-display font-bold uppercase text-[10px] tracking-wider border-b border-[#1f2937]">
              <tr>
                <th className="px-3 py-2.5">Model Algorithm</th>
                <th className="px-3 py-2.5">Role</th>
                <th className="px-3 py-2.5">Precision</th>
                <th className="px-3 py-2.5">Recall</th>
                <th className="px-3 py-2.5">F1-Score</th>
                <th className="px-3 py-2.5">AUPRC</th>
                <th className="px-3 py-2.5">ROC-AUC</th>
                <th className="px-3 py-2.5">Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937] font-mono">
              {EXPERIMENT_RESULTS.map((row, idx) => {
                const isProd = row.role === 'Production Deployed';
                const isBench = row.role === 'Academic Benchmark';
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-[#1f2937]/40 transition ${
                      isProd ? 'bg-emerald-500/10 border-l-2 border-emerald-400' :
                      isBench ? 'bg-[#1f2937]/30 border-l-2 border-slate-400' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 font-bold text-white">{row.model}</td>
                    <td className="px-3 py-2.5 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isProd ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        isBench ? 'bg-slate-700 text-slate-200' :
                        'bg-[#111827] text-slate-400'
                      }`}>
                        {row.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-200">{row.precision}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-400">{row.recall}</td>
                    <td className="px-3 py-2.5 font-bold text-amber-400">{row.f1}</td>
                    <td className="px-3 py-2.5 text-sky-400">{row.auprc}</td>
                    <td className="px-3 py-2.5 text-slate-300">{row.roc}</td>
                    <td className="px-3 py-2.5 font-bold text-white">{row.threshold}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Static Evaluation Plot Gallery */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
          <Image className="w-4 h-4 text-emerald-400" />
          Phase 1 Evaluation Artifacts & Diagnostic Plots
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plots.map((plot, idx) => (
            <div key={idx} className="fintech-card p-5 space-y-3">
              <h4 className="font-display font-bold text-xs text-slate-200 uppercase tracking-wide">
                {plot.title}
              </h4>
              <p className="font-sans text-xs text-slate-400">{plot.desc}</p>

              <div
                onClick={() => setSelectedImage(`${API_BASE}/api/plots/${plot.filename}`)}
                className="bg-[#0b0f19] border border-[#1f2937] rounded-lg p-2 overflow-hidden cursor-pointer hover:border-slate-500 transition group"
              >
                <img
                  src={`${API_BASE}/api/plots/${plot.filename}`}
                  alt={plot.title}
                  className="w-full h-48 object-contain rounded group-hover:scale-102 transition duration-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/600x300?text=Plot+Artifact+Image";
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Zoomed Plot Image */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" onClick={() => setSelectedImage(null)}>
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-3 border-b border-[#1f2937] pb-2">
              <span className="font-display font-bold text-xs text-white uppercase">Evaluation Plot Preview</span>
              <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-white font-mono text-xs">Close [ESC]</button>
            </div>
            <img src={selectedImage} alt="Zoomed Plot" className="w-full h-auto rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
