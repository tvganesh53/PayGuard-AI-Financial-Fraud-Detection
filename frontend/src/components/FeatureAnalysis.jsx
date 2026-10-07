import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Layers, Activity, HelpCircle } from 'lucide-react';

export default function FeatureAnalysis({ globalImportances, shapValues, shapBaseValue }) {
  const [activeTab, setActiveTab] = useState('local'); // 'local' (SHAP) or 'global'

  // Prepare Local SHAP Data
  const shapData = shapValues ? Object.keys(shapValues).map(key => ({
    feature: key,
    shap: shapValues[key],
    absShap: Math.abs(shapValues[key])
  })).sort((a, b) => b.absShap - a.absShap) : [];

  // Prepare Global Importance Data
  const globalData = globalImportances ? Object.keys(globalImportances).map(key => ({
    feature: key,
    importance: globalImportances[key] * 100
  })).sort((a, b) => b.importance - a.importance) : [];

  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            AI Feature Contribution & SHAP Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tree SHAP local explanation vs Global XGBoost model feature importance
          </p>
        </div>

        {/* Tab Toggle Button */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('local')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'local' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Local Prediction (Tree SHAP)
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'global' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Global Model Importance
          </button>
        </div>
      </div>

      {/* LOCAL SHAP WATERFALL TAB */}
      {activeTab === 'local' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span>Base Model Logit: <strong className="text-white font-mono">{shapBaseValue ?? '1.8178'}</strong></span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded bg-red-500" /> Pushes Fraud (+)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Pushes Legit (-)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={shapData} margin={{ left: 140, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#64748b" tickFormatter={(val) => val.toFixed(1)} />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                  formatter={(value) => [`SHAP Contribution: ${value}`, 'Impact']}
                />
                <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
                <Bar dataKey="shap" radius={[4, 4, 4, 4]}>
                  {shapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.shap > 0 ? '#ef4444' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* GLOBAL IMPORTANCE TAB */}
      {activeTab === 'global' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Global gain feature importance across all 300 decision trees in the Leakage-Safe XGBoost model.
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={globalData} margin={{ left: 140, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#64748b" tickFormatter={(val) => `${val.toFixed(0)}%`} />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Gain Importance']}
                />
                <Bar dataKey="importance" fill="#0284c7" radius={[0, 4, 4, 0]}>
                  {globalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#38bdf8' : '#0284c7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
