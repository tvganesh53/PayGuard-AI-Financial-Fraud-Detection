import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar, { NAV_ITEMS } from './components/Sidebar';
import TopBar from './components/TopBar';
import InvestigationDrawer from './components/InvestigationDrawer';

import OverviewPage from './pages/OverviewPage';
import TransactionScannerPage from './pages/TransactionScannerPage';
import PredictionHistoryPage from './pages/PredictionHistoryPage';
import InvestigationPage from './pages/InvestigationPage';
import ExplainableAIPage from './pages/ExplainableAIPage';
import ModelIntelligencePage from './pages/ModelIntelligencePage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';
import ReportsPage from './pages/ReportsPage';

import './styles/themes.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Shared Transaction State for Investigation & Drawer
  const [selectedDrawerItem, setSelectedDrawerItem] = useState(null);
  const [investigationRecord, setInvestigationRecord] = useState(null);

  const activeItem = NAV_ITEMS.find(n => n.id === activeTab) || NAV_ITEMS[0];

  const handleOpenDrawer = (item) => {
    setSelectedDrawerItem(item);
  };

  const handleNavigateToFullInvestigation = (item) => {
    setInvestigationRecord(item);
    setActiveTab('investigation');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans antialiased flex flex-col md:flex-row">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          collapsed ? 'md:ml-16' : 'md:ml-60'
        }`}>
          <TopBar
            activeTabTitle={activeItem.label}
            setMobileOpen={setMobileOpen}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {activeTab === 'overview' && (
              <OverviewPage
                onSelectTransaction={handleOpenDrawer}
                onNavigateToScanner={() => setActiveTab('scanner')}
              />
            )}
            {activeTab === 'scanner' && (
              <TransactionScannerPage
                onSelectTransaction={handleOpenDrawer}
              />
            )}
            {activeTab === 'history' && (
              <PredictionHistoryPage
                onSelectTransaction={handleOpenDrawer}
              />
            )}
            {activeTab === 'investigation' && (
              <InvestigationPage
                initialRecord={investigationRecord}
              />
            )}
            {activeTab === 'explainability' && (
              <ExplainableAIPage
                initialPrediction={selectedDrawerItem}
              />
            )}
            {activeTab === 'model' && (
              <ModelIntelligencePage />
            )}
            {activeTab === 'evaluation' && (
              <ModelEvaluationPage />
            )}
            {activeTab === 'reports' && (
              <ReportsPage />
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-[#1f2937] py-4 px-6 text-center text-xs font-mono text-slate-500">
            PAYGUARD AI &bull; Temporal XGBoost Model Engine v2.1.4 &bull; Production Threshold: 0.90 &bull; Financial Security Workspace
          </footer>
        </div>

        {/* Global Slide-In Investigation Drawer */}
        <InvestigationDrawer
          item={selectedDrawerItem}
          onClose={() => setSelectedDrawerItem(null)}
          onNavigateToInvestigation={handleNavigateToFullInvestigation}
        />

      </div>
    </ThemeProvider>
  );
}
