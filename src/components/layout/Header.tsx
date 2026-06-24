import React, { useState, useEffect } from 'react';
import { useVaultStore } from '../../store/vaultStore';
import { Menu, Search, Plus, Bell, Sparkles } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/vaultDb';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { activeTab, setCommandPaletteOpen, setQuickAddOpen, username, currency } = useVaultStore();
  const [showInsights, setShowInsights] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  // Fetch transactions to generate dynamic insights
  const transactions = useLiveQuery(() => db.transactions.toArray());

  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setInsight('Welcome to Vault! Add your first transactions to generate intelligent insights.');
      return;
    }

    const expenses = transactions.filter((t) => t.type === 'expense');
    const income = transactions.filter((t) => t.type === 'income');

    if (expenses.length === 0) {
      setInsight("Outstanding start! You haven't recorded any expenses yet.");
      return;
    }

    // Insight 1: Highest spending category
    const catMap: Record<string, number> = {};
    expenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    let topCat = '';
    let topCatAmt = 0;
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > topCatAmt) {
        topCat = cat;
        topCatAmt = amt;
      }
    });

    // Insight 2: Savings rate this month
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalInc = income.reduce((sum, i) => sum + i.amount, 0);
    
    if (totalInc > 0) {
      const savingsRate = ((totalInc - totalExp) / totalInc) * 100;
      if (savingsRate > 30) {
        setInsight(`High savings rate alert: You saved ${savingsRate.toFixed(0)}% of your earnings. Keep it up!`);
      } else if (savingsRate < 10 && savingsRate > 0) {
        setInsight(`Savings Rate is low (${savingsRate.toFixed(0)}%). Consider auditing your ${topCat} category.`);
      } else if (savingsRate < 0) {
        setInsight(`Cashflow warning: Spending exceeds income. ${topCat} accounts for ${CURRENCY_FORMAT(topCatAmt)}.`);
      } else {
        setInsight(`Spending is balanced. Your largest expense category is ${topCat} (${CURRENCY_FORMAT(topCatAmt)}).`);
      }
    } else {
      setInsight(`Largest spending category: ${topCat} (${CURRENCY_FORMAT(topCatAmt)}). Set up income to track savings rate.`);
    }
  }, [transactions]);

  const CURRENCY_FORMAT = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Overview';
      case 'transactions': return 'Transactions Ledger';
      case 'investments': return 'Investment Portfolio';
      case 'goals': return 'Savings Targets';
      case 'analytics': return 'Deep Analytics';
      case 'settings': return 'System Settings';
      default: return 'Vault';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-zinc-950/40 border-b border-white/5 backdrop-blur-md">
      {/* Left section: mobile toggle and page title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white m-0">
            {getTabTitle()}
          </h1>
          <p className="text-xs text-zinc-500 hidden md:block">
            Hello, {username || 'User'} · Welcome back
          </p>
        </div>
      </div>

      {/* Right section: search prompt, insights, and quick add */}
      <div className="flex items-center gap-3">
        {/* Search / Command palette launcher */}
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-3.5 px-4 h-10 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 text-zinc-400 hover:text-zinc-300 text-sm tracking-wide transition-all cursor-pointer"
        >
          <Search size={15} />
          <span>Search or commands...</span>
          <kbd className="text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-500 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Dynamic Insights Alert */}
        <div className="relative">
          <button 
            onClick={() => setShowInsights(!showInsights)}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              showInsights 
                ? 'bg-violet-500/10 border-violet-500 text-violet-400' 
                : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
            }`}
            title="Vault Insights"
          >
            <Bell size={18} />
          </button>
          
          {showInsights && (
            <div className="absolute right-0 mt-3 w-80 glass-panel p-4 z-40 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Vault AI Insights</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {insight}
              </p>
            </div>
          )}
        </div>

        {/* Quick Add Transaction */}
        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-4 h-10 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-white/5"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Transaction</span>
        </button>
      </div>
    </header>
  );
};
