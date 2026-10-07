import React from 'react';
import { 
  ShieldAlert, LayoutDashboard, Search, ListFilter, FileSearch, 
  BrainCircuit, Cpu, LineChart, FileText, ChevronLeft, ChevronRight, X 
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'scanner', label: 'Transaction Scanner', icon: Search },
  { id: 'history', label: 'Transactions', icon: ListFilter },
  { id: 'investigation', label: 'Investigations', icon: FileSearch },
  { id: 'explainability', label: 'Explainability', icon: BrainCircuit },
  { id: 'model', label: 'Model Intelligence', icon: Cpu },
  { id: 'evaluation', label: 'Model Evaluation', icon: LineChart },
  { id: 'reports', label: 'Reports', icon: FileText }
];

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const content = (
    <div className="h-full flex flex-col justify-between py-5 px-3">
      {/* Top Branding Section */}
      <div>
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1f2937] text-white rounded-lg border border-[#374151]">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-display font-bold text-base tracking-wider text-white leading-none">
                  PAYGUARD <span className="text-emerald-400">AI</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Financial Security Workspace</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg bg-[#111827] border border-[#1f2937] text-slate-400 hover:text-white hover:border-slate-600 transition"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg bg-[#111827] border border-[#1f2937] text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Heading */}
        {!collapsed && (
          <div className="px-2 mb-2">
            <span className="font-display font-bold text-[10px] uppercase tracking-widest text-slate-500">
              NAVIGATION
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (mobileOpen) setMobileOpen(false);
                }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-display font-medium text-xs transition-colors duration-150 relative ${
                  isActive
                    ? 'bg-[#1f2937] text-white border border-[#374151]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111827]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-400 rounded-r-full" />
                )}

                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Model Status Card */}
      {!collapsed && (
        <div className="p-3 bg-[#111827] border border-[#1f2937] rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-display font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ENGINE ONLINE
            </span>
            <span className="text-[10px] font-mono text-slate-400">v2.0.0</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono space-y-1 border-t border-[#1f2937] pt-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Threshold:</span>
              <span className="text-white font-bold">90.00%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Model:</span>
              <span className="text-slate-300 font-semibold">XGBoost CW</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:block fixed left-0 top-0 bottom-0 z-40 bg-[#0b0f19] border-r border-[#1f2937] transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}>
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-[#0b0f19] border-r border-[#1f2937] h-full z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
