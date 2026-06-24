import React, { useState, useEffect } from 'react';
import { useVaultStore } from './store/vaultStore';
import { motion, AnimatePresence } from 'framer-motion';

// Layout & Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/layout/CommandPalette';
import { TransactionModal } from './components/transactions/TransactionModal';
import { ConfirmationModal } from './components/shared/ConfirmationModal';

// Pages
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Investments } from './pages/Investments';
import { Goals } from './pages/Goals';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const { 
    onboardingCompleted, 
    activeTab, 
    setActiveTab, 
    theme, 
    setQuickAddOpen 
  } = useVaultStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 1. Sync theme class on mount and change
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-carbon', 'theme-light');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // 2. Global keyboard shortcuts helper
  useEffect(() => {
    let lastKey = '';
    let timeoutId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when editing input forms
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Sequence: G followed by page char
      if (lastKey === 'g') {
        e.preventDefault();
        if (key === 'd') setActiveTab('dashboard');
        if (key === 't') setActiveTab('transactions');
        if (key === 'i') setActiveTab('investments');
        if (key === 'g') setActiveTab('goals');
        if (key === 'a') setActiveTab('analytics');
        if (key === 's') setActiveTab('settings');
        lastKey = '';
        return;
      }

      // Quick record shortcut (N)
      if (key === 'n') {
        e.preventDefault();
        setQuickAddOpen(true);
      }

      // Start sequence detector
      if (key === 'g') {
        lastKey = 'g';
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          lastKey = '';
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(timeoutId);
    };
  }, [setActiveTab, setQuickAddOpen]);

  // 3. Guards for first launch onboarding
  if (!onboardingCompleted) {
    return <Onboarding />;
  }

  // 4. Navigation routing router
  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'investments':
        return <Investments />;
      case 'goals':
        return <Goals />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-grid-overlay bg-zinc-950 text-zinc-100 flex overflow-hidden">
      {/* Decorative colored glow fields */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Sidebar navigation panel */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main container area */}
      <div className={`flex-1 flex flex-col min-w-0 z-10 transition-all duration-300 ${
        sidebarOpen 
          ? 'max-md:translate-x-64 md:pl-64' 
          : 'translate-x-0 md:pl-0'
      }`}>
        
        {/* Top Header bar */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Dynamic sliding page contents */}
        <main className="flex-1 pt-[104px] px-6 pb-6 md:pt-[112px] md:px-8 md:pb-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full max-w-7xl mx-auto"
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modals & Dialogs overlays */}
      <CommandPalette />
      <TransactionModal />
      <ConfirmationModal />
    </div>
  );
};
export default App;
