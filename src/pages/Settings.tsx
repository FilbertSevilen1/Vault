import React, { useRef, useState } from 'react';
import { useVaultStore, CURRENCY_SYMBOLS } from '../store/vaultStore';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/vaultDb';
import { jsPDF } from 'jspdf';
import { format, parseISO, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';
import { 
  Palette, 
  Database, 
  Trash2, 
  FileText, 
  UploadCloud, 
  DownloadCloud, 
  Check, 
  Info
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    currency, 
    setCurrency, 
    theme, 
    setTheme, 
    username, 
    setUsername, 
    resetAll,
    showConfirm
  } = useVaultStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch db content for exports
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const investments = useLiveQuery(() => db.investments.toArray()) || [];
  const goals = useLiveQuery(() => db.goals.toArray()) || [];

  const currencies = Object.keys(CURRENCY_SYMBOLS);

  const formatVal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // 1. Export Data (JSON)
  const handleExportJSON = () => {
    const backupData = {
      version: 1,
      createdAt: new Date().toISOString(),
      transactions,
      investments,
      goals,
      settings: { currency, theme, username }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vault_Backup_${format(new Date(), 'yyyyMMdd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Backup exported successfully.');
  };

  // 2. Import Data (JSON)
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.transactions || !data.investments || !data.goals) {
          throw new Error('Invalid backup schema.');
        }

        // Wipe current
        await Promise.all([
          db.transactions.clear(),
          db.investments.clear(),
          db.goals.clear()
        ]);

        // Bulk load
        if (data.transactions.length > 0) {
          // Remove ID constraints to avoid index collisions if auto-increment
          const txClean = data.transactions.map(({ id, ...t }: any) => t);
          await db.transactions.bulkAdd(txClean);
        }
        if (data.investments.length > 0) {
          const invClean = data.investments.map(({ id, ...i }: any) => i);
          await db.investments.bulkAdd(invClean);
        }
        if (data.goals.length > 0) {
          const goalClean = data.goals.map(({ id, ...g }: any) => g);
          await db.goals.bulkAdd(goalClean);
        }

        if (data.settings) {
          if (data.settings.currency) setCurrency(data.settings.currency);
          if (data.settings.theme) setTheme(data.settings.theme);
          if (data.settings.username) setUsername(data.settings.username);
        }

        showSuccess('Backup restored successfully.');
      } catch (err) {
        console.error(err);
        showError('Failed to import JSON backup. Ensure the file is a valid Vault export.');
      }
    };
    reader.readAsText(file);
  };

  // 3. Reset all database entries
  const handleReset = () => {
    showConfirm(
      'Reset All Vault Data',
      'WARNING: This will wipe all financial records, investments, savings goals, and reset your preferences. This action is irreversible. Proceed?',
      async () => {
        await resetAll();
        showSuccess('Vault cleared completely.');
      }
    );
  };

  // Success helper
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };
  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // 4. PDF Reports Generator
  const generatePDFReport = (type: 'monthly' | 'annual' | 'investments') => {
    const doc = new jsPDF();
    const now = new Date();
    
    // Theme Colors
    doc.setFillColor(9, 9, 11);
    doc.rect(0, 0, 210, 297, 'F'); // Dark background layout
    
    // Header Style
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('VAULT', 20, 25);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text('PRIVACY-FIRST FINANCIAL REPORT · LOCAL DEVICE STORAGE ONLY', 20, 31);
    
    // Line separator
    doc.setDrawColor(255, 255, 255, 0.08);
    doc.line(20, 38, 190, 38);

    doc.setTextColor(255, 255, 255);
    
    if (type === 'monthly') {
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Monthly Financial Ledger: ${format(now, 'MMMM yyyy')}`, 20, 48);
      
      // Calculate monthly totals
      const mStart = startOfMonth(now);
      const mEnd = endOfMonth(now);
      const mTx = transactions.filter(t => {
        const d = parseISO(t.date);
        return !isBefore(d, mStart) && !isAfter(d, mEnd);
      });
      
      const earnings = mTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const spend = mTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const rate = earnings > 0 ? ((earnings - spend) / earnings) * 100 : 0;
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(161, 161, 170);
      doc.text(`Report compiled for: ${username || 'Vault User'}`, 20, 54);
      doc.text(`Generated on: ${format(now, 'yyyy-MM-dd HH:mm')}`, 20, 59);

      // Aggregations panel
      doc.setFillColor(25, 25, 30);
      doc.rect(20, 66, 170, 24, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.text('Total Earnings', 30, 74);
      doc.text('Total Expenses', 85, 74);
      doc.text('Savings Rate', 145, 74);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129); // green
      doc.text(formatVal(earnings), 30, 82);
      doc.setTextColor(244, 63, 94); // rose
      doc.text(formatVal(spend), 85, 82);
      doc.setTextColor(139, 92, 246); // purple
      doc.text(`${rate.toFixed(1)}%`, 145, 82);

      // Ledger Table
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text('Recent Monthly Transactions', 20, 104);
      
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text('DATE', 20, 112);
      doc.text('CATEGORY', 45, 112);
      doc.text('NOTES', 80, 112);
      doc.text('PAYMENT', 130, 112);
      doc.text('AMOUNT', 170, 112);
      
      doc.setDrawColor(255, 255, 255, 0.05);
      doc.line(20, 115, 190, 115);
      
      let y = 121;
      doc.setTextColor(228, 228, 231);
      mTx.slice(0, 15).forEach((t) => {
        if (y > 270) return; // simple page constraint
        doc.text(t.date, 20, y);
        doc.text(t.category, 45, y);
        doc.text(t.notes ? (t.notes.substring(0, 22)) : 'N/A', 80, y);
        doc.text(t.type === 'expense' ? (t.paymentMethod || 'Credit') : 'Income', 130, y);
        
        doc.setFont('Helvetica', 'bold');
        if (t.type === 'income') {
          doc.setTextColor(16, 185, 129);
          doc.text(`+${formatVal(t.amount)}`, 170, y);
        } else {
          doc.setTextColor(244, 63, 94);
          doc.text(`-${formatVal(t.amount)}`, 170, y);
        }
        doc.setTextColor(228, 228, 231);
        doc.setFont('Helvetica', 'normal');
        
        y += 8;
      });

      if (mTx.length === 0) {
        doc.text('No ledger transactions recorded in the current month.', 20, 125);
      }
      
    } else if (type === 'annual') {
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Annual Financial Performance Audit: ${format(now, 'yyyy')}`, 20, 48);
      
      const earningsAll = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const spendAll = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const netLiquid = earningsAll - spendAll;
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(161, 161, 170);
      doc.text(`Report compiled for: ${username || 'Vault User'}`, 20, 54);
      
      // Cumulative Stats Panel
      doc.setFillColor(25, 25, 30);
      doc.rect(20, 66, 170, 24, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.text('All-Time Incomes', 30, 74);
      doc.text('All-Time Spending', 85, 74);
      doc.text('Liquid Cash Reserves', 140, 74);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text(formatVal(earningsAll), 30, 82);
      doc.setTextColor(244, 63, 94);
      doc.text(formatVal(spendAll), 85, 82);
      doc.setTextColor(255, 255, 255);
      doc.text(formatVal(netLiquid), 140, 82);

      // Savings Goals target listing
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text('Savings Goals Progress Ledger', 20, 104);
      
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text('GOAL TARGET NAME', 20, 112);
      doc.text('DEADLINE', 70, 112);
      doc.text('TARGET AMOUNT', 105, 112);
      doc.text('SAVED AMOUNT', 140, 112);
      doc.text('PROGRESS %', 170, 112);
      
      doc.setDrawColor(255, 255, 255, 0.05);
      doc.line(20, 115, 190, 115);
      
      let y = 121;
      doc.setTextColor(228, 228, 231);
      goals.forEach((goal) => {
        const pct = (goal.currentAmount / goal.targetAmount) * 100;
        doc.text(goal.name, 20, y);
        doc.text(goal.deadline, 70, y);
        doc.text(formatVal(goal.targetAmount), 105, y);
        doc.text(formatVal(goal.currentAmount), 140, y);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(139, 92, 246);
        doc.text(`${pct.toFixed(0)}%`, 170, y);
        doc.setTextColor(228, 228, 231);
        doc.setFont('Helvetica', 'normal');
        y += 8;
      });
      
      if (goals.length === 0) {
        doc.text('No active savings goals configured.', 20, 125);
      }

    } else if (type === 'investments') {
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('Investment Portfolio Asset Valuation', 20, 48);
      
      const portfolioVal = investments.reduce((sum, inv) => sum + (inv.currentValue * inv.quantity), 0);
      const costBasis = investments.reduce((sum, inv) => sum + (inv.buyPrice * inv.quantity), 0);
      const gain = portfolioVal - costBasis;
      const gainPct = costBasis > 0 ? (gain / costBasis) * 100 : 0;
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(161, 161, 170);
      doc.text(`Report compiled for: ${username || 'Vault User'}`, 20, 54);
      
      // Aggregations panel
      doc.setFillColor(25, 25, 30);
      doc.rect(20, 66, 170, 24, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.text('Total Portfolio Cost', 30, 74);
      doc.text('Current Valuation', 85, 74);
      doc.text('Total Net Profit/Loss', 140, 74);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(formatVal(costBasis), 30, 82);
      doc.text(formatVal(portfolioVal), 85, 82);
      if (gain >= 0) {
        doc.setTextColor(16, 185, 129);
        doc.text(`+${formatVal(gain)} (${gainPct.toFixed(1)}%)`, 140, 82);
      } else {
        doc.setTextColor(244, 63, 94);
        doc.text(`${formatVal(gain)} (${gainPct.toFixed(1)}%)`, 140, 82);
      }

      // Asset Listings
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text('Asset Holdings Allocation Ledger', 20, 104);
      
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text('ASSET HOLDING', 20, 112);
      doc.text('TYPE', 70, 112);
      doc.text('QUANTITY', 95, 112);
      doc.text('BUY PRICE', 120, 112);
      doc.text('CURRENT VALUE', 145, 112);
      doc.text('GAIN / LOSS', 170, 112);
      
      doc.setDrawColor(255, 255, 255, 0.05);
      doc.line(20, 115, 190, 115);
      
      let y = 121;
      doc.setTextColor(228, 228, 231);
      investments.forEach((inv) => {
        const c = inv.buyPrice * inv.quantity;
        const v = inv.currentValue * inv.quantity;
        const g = v - c;
        doc.text(inv.assetName, 20, y);
        doc.text(inv.assetType, 70, y);
        doc.text(inv.quantity.toString(), 95, y);
        doc.text(formatVal(inv.buyPrice), 120, y);
        doc.text(formatVal(inv.currentValue), 145, y);
        
        doc.setFont('Helvetica', 'bold');
        if (g >= 0) {
          doc.setTextColor(16, 185, 129);
          doc.text(`+${formatVal(g)}`, 170, y);
        } else {
          doc.setTextColor(244, 63, 94);
          doc.text(formatVal(g), 170, y);
        }
        doc.setTextColor(228, 228, 231);
        doc.setFont('Helvetica', 'normal');
        y += 8;
      });

      if (investments.length === 0) {
        doc.text('No active investment portfolios found.', 20, 125);
      }
    }
    
    // Page Footer
    doc.setTextColor(113, 113, 122);
    doc.setFontSize(7);
    doc.text('CONFIDENTIAL FINANCIAL LEDGER · GENERATED EXCLUSIVELY VIA VAULT OFFLINE BROWSER DATABASE', 20, 285);
    
    // Save report
    doc.save(`Vault_Report_${type}_${format(now, 'yyyyMMdd_HHmm')}.pdf`);
    showSuccess(`${type.toUpperCase()} PDF Report downloaded successfully.`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check size={14} />
          {successMsg}
        </div>
      )}
      
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Trash2 size={14} />
          {errorMsg}
        </div>
      )}

      {/* 1. Theme and Preferences Card */}
      <div className="glass-panel p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Interface Settings</h2>
          <p className="text-xs text-zinc-500">Configure visual themes, currencies and personal metadata</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User profile username */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Vault Owner Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-zinc-300 text-sm focus:outline-none transition-all font-semibold"
            />
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Global Ledger Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-zinc-950/40 border border-white/5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3.5 py-2.5 text-zinc-300 text-sm focus:outline-none transition-all font-semibold"
            >
              {currencies.map(code => (
                <option key={code} value={code} className="bg-zinc-950">
                  {code} ({CURRENCY_SYMBOLS[code]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme select buttons */}
        <div className="space-y-2.5 pt-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Palette size={12} className="text-violet-400" /> UI Theme Selection
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: 'Obsidian Dark', desc: 'Sleek dark layout' },
              { id: 'carbon', label: 'Carbon Black', desc: 'OLED pure black' },
              { id: 'light', label: 'Clean Light', desc: 'Minimal soft light' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={`p-4 text-left border rounded-xl transition-all cursor-pointer ${
                  theme === t.id
                    ? 'bg-violet-500/10 border-violet-500 text-white font-semibold'
                    : 'bg-zinc-950/40 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200'
                }`}
              >
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="text-[10px] text-zinc-500 mt-1 font-normal">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Downloadable PDF Reports */}
      <div className="glass-panel p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-violet-400" /> Financial Reports
          </h2>
          <p className="text-xs text-zinc-500">Download formatted audits of your financial progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Monthly Report */}
          <button
            onClick={() => generatePDFReport('monthly')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 hover:border-white/10 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all cursor-pointer group"
          >
            <span className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 mb-2 border border-emerald-500/10">
              <FileText size={18} />
            </span>
            <span className="text-sm font-bold text-white">Monthly Summary</span>
            <span className="text-[10px] text-zinc-500 mt-1 text-center">Ledgers for the current month</span>
          </button>

          {/* Annual Summary */}
          <button
            onClick={() => generatePDFReport('annual')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 hover:border-white/10 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all cursor-pointer group"
          >
            <span className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400 mb-2 border border-violet-500/10">
              <FileText size={18} />
            </span>
            <span className="text-sm font-bold text-white">Annual Summary</span>
            <span className="text-[10px] text-zinc-500 mt-1 text-center">Financial milestones and trends</span>
          </button>

          {/* Investment Summary */}
          <button
            onClick={() => generatePDFReport('investments')}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 hover:border-white/10 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all cursor-pointer group"
          >
            <span className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 mb-2 border border-cyan-500/10">
              <FileText size={18} />
            </span>
            <span className="text-sm font-bold text-white">Portfolio Valuation</span>
            <span className="text-[10px] text-zinc-500 mt-1 text-center">Holdings details and net gains</span>
          </button>
        </div>
      </div>

      {/* 3. System Data Backups & Reset */}
      <div className="glass-panel p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Database size={16} className="text-violet-400" /> Database Administration
          </h2>
          <p className="text-xs text-zinc-500 font-medium">Backup, restore or reset local browser database tables</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Backup data JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:border-white/10 hover:bg-zinc-950/85 text-left transition-all cursor-pointer group"
          >
            <span className="p-2 bg-violet-500/10 text-violet-400 rounded-lg group-hover:scale-105 transition-transform">
              <DownloadCloud size={18} />
            </span>
            <div>
              <div className="text-sm font-bold text-white">Export Vault Backup</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Saves a JSON snapshot of your data</div>
            </div>
          </button>

          {/* Import data JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-zinc-950/40 hover:border-white/10 hover:bg-zinc-950/85 text-left transition-all cursor-pointer group"
          >
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
              <UploadCloud size={18} />
            </span>
            <div>
              <div className="text-sm font-bold text-white">Restore Vault Backup</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Restore configurations from a JSON file</div>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </div>

        {/* Danger reset box */}
        <div className="border border-rose-500/20 bg-rose-500/5 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Info size={14} className="text-rose-400" /> Danger Zone
            </h4>
            <p className="text-xs text-zinc-500 max-w-lg">
              Wipe all transactional ledgers, savings goals, tracked portfolios and settings from the local database. This action is final.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            Reset all Vault Data
          </button>
        </div>
      </div>
    </div>
  );
};
export default Settings;
