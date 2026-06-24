import React, { useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/vaultDb';
import type { Transaction } from '../types';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { format, parseISO, subDays } from 'date-fns';
import Papa from 'papaparse';
import { 
  Search, 
  ArrowUpDown, 
  Trash2, 
  Edit3, 
  Download, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Gamepad2, 
  FileText, 
  HeartPulse, 
  GraduationCap, 
  Plane, 
  Briefcase, 
  Laptop, 
  DollarSign, 
  TrendingUp, 
  CircleDot,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Landmark,
  Coins,
  Wallet
} from 'lucide-react';

export const Transactions: React.FC = () => {
  const { currency, showConfirm } = useVaultStore();

  // State management
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '30days' | 'thisMonth' | '6months'>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for edit transaction
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Fetch transactions from DB
  const rawTransactions = useLiveQuery(() => db.transactions.toArray()) || [];

  // Helper: Format amount to currency
  const formatVal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get icons based on category
  const getCategoryIcon = (category: string, type: 'income' | 'expense') => {
    if (type === 'income') {
      switch (category) {
        case 'Salary': return <Briefcase size={16} className="text-emerald-400" />;
        case 'Freelance': return <Laptop size={16} className="text-cyan-400" />;
        case 'Business': return <TrendingUp size={16} className="text-blue-400" />;
        case 'Investments': return <DollarSign size={16} className="text-indigo-400" />;
        default: return <CircleDot size={16} className="text-zinc-400" />;
      }
    } else {
      switch (category) {
        case 'Food': return <Utensils size={16} className="text-amber-400" />;
        case 'Transport': return <Car size={16} className="text-blue-400" />;
        case 'Shopping': return <ShoppingBag size={16} className="text-pink-400" />;
        case 'Entertainment': return <Gamepad2 size={16} className="text-purple-400" />;
        case 'Bills': return <FileText size={16} className="text-rose-400" />;
        case 'Healthcare': return <HeartPulse size={16} className="text-teal-400" />;
        case 'Education': return <GraduationCap size={16} className="text-indigo-400" />;
        case 'Travel': return <Plane size={16} className="text-orange-400" />;
        default: return <CircleDot size={16} className="text-zinc-400" />;
      }
    }
  };

  // Helper: Render payment method badge with premium colors and icons
  const renderPaymentMethodBadge = (method: string) => {
    const norm = (method || 'Credit Card').toLowerCase();
    
    let icon = <CreditCard size={12} />;
    let badgeClass = '';
    
    if (norm.includes('credit')) {
      icon = <CreditCard size={12} />;
      badgeClass = 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
    } else if (norm.includes('debit')) {
      icon = <CreditCard size={12} />;
      badgeClass = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    } else if (norm.includes('bank') || norm.includes('transfer')) {
      icon = <Landmark size={12} />;
      badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    } else if (norm.includes('cash')) {
      icon = <Coins size={12} />;
      badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    } else if (norm.includes('apple')) {
      icon = <Wallet size={12} />;
      badgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    } else {
      badgeClass = 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass} transition-all`}>
        {icon}
        {method || 'Credit Card'}
      </span>
    );
  };

  // Filter & Sort Logic
  const filteredTransactions = rawTransactions
    .filter(t => {
      // 1. Search notes or category
      const term = search.toLowerCase();
      const matchSearch = t.notes.toLowerCase().includes(term) || t.category.toLowerCase().includes(term);
      
      // 2. Filter Type
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      
      // 3. Filter Category
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;

      // 4. Filter Date Range
      let matchDate = true;
      const tDate = parseISO(t.date);
      const now = new Date();

      if (dateRangeFilter === '30days') {
        matchDate = tDate >= subDays(now, 30);
      } else if (dateRangeFilter === 'thisMonth') {
        matchDate = format(tDate, 'yyyy-MM') === format(now, 'yyyy-MM');
      } else if (dateRangeFilter === '6months') {
        matchDate = tDate >= subDays(now, 180);
      }

      return matchSearch && matchType && matchCategory && matchDate;
    })
    .sort((a, b) => {
      // Sort logic
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Pagination bounds
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Delete transaction
  const handleDelete = (id?: number) => {
    if (!id) return;
    showConfirm(
      'Delete Transaction',
      'Are you sure you want to delete this transaction from the ledger?',
      async () => {
        await db.transactions.delete(id);
      }
    );
  };

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    // Format transactions for CSV
    const dataToExport = filteredTransactions.map(t => ({
      ID: t.id,
      Type: t.type.toUpperCase(),
      Amount: t.amount,
      Category: t.category,
      Date: t.date,
      Notes: t.notes,
      PaymentMethod: t.paymentMethod || 'N/A'
    }));

    const csvString = Papa.unparse(dataToExport);
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vault_Transactions_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const expenseCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other'];
  const incomeSources = ['Salary', 'Freelance', 'Business', 'Investments', 'Other'];
  const categoriesList = typeFilter === 'expense' 
    ? expenseCategories 
    : typeFilter === 'income' 
      ? incomeSources 
      : Array.from(new Set([...expenseCategories, ...incomeSources]));

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by notes or category..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full bg-zinc-950/40 border border-white/5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-11 pr-4 py-2.5 text-zinc-200 placeholder-zinc-600 text-sm focus:outline-none transition-all"
            />
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Type Filter */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Transaction Type</span>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as any); setCategoryFilter('all'); setCurrentPage(1); }}
              className="w-full bg-zinc-950/40 border border-white/5 focus:border-violet-500 rounded-xl px-3 py-2 text-zinc-300 text-xs font-semibold focus:outline-none transition-all"
            >
              <option value="all" className="bg-zinc-950 text-zinc-300">All Types</option>
              <option value="expense" className="bg-zinc-950 text-zinc-300">Expenses Only</option>
              <option value="income" className="bg-zinc-950 text-zinc-300">Income Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-zinc-950/40 border border-white/5 focus:border-violet-500 rounded-xl px-3 py-2 text-zinc-300 text-xs font-semibold focus:outline-none transition-all"
            >
              <option value="all" className="bg-zinc-950">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat} className="bg-zinc-950">{cat}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Date Range</span>
            <select
              value={dateRangeFilter}
              onChange={(e) => { setDateRangeFilter(e.target.value as any); setCurrentPage(1); }}
              className="w-full bg-zinc-950/40 border border-white/5 focus:border-violet-500 rounded-xl px-3 py-2 text-zinc-300 text-xs font-semibold focus:outline-none transition-all"
            >
              <option value="all" className="bg-zinc-950">All Time</option>
              <option value="thisMonth" className="bg-zinc-950">This Month</option>
              <option value="30days" className="bg-zinc-950">Last 30 Days</option>
              <option value="6months" className="bg-zinc-950">Last 6 Months</option>
            </select>
          </div>

          {/* Sorting control */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Sorting Options</span>
            <div className="flex gap-2">
              <select
                value={sortField}
                onChange={(e) => { setSortField(e.target.value as any); setCurrentPage(1); }}
                className="w-2/3 bg-zinc-950/40 border border-white/5 focus:border-violet-500 rounded-xl px-3 py-2 text-zinc-300 text-xs font-semibold focus:outline-none transition-all"
              >
                <option value="date" className="bg-zinc-950">Sort by Date</option>
                <option value="amount" className="bg-zinc-950">Sort by Amount</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="w-1/3 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
                title="Toggle Sorting Direction"
              >
                <ArrowUpDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 hidden sm:table-cell">Payment Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
              {paginatedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.01] transition-colors">
                  {/* Date */}
                  <td className="px-6 py-4.5 font-medium whitespace-nowrap text-zinc-400">
                    {format(parseISO(t.date), 'MMM dd, yyyy')}
                  </td>
                  {/* Category with icon */}
                  <td className="px-6 py-4.5">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-semibold text-white">
                      {getCategoryIcon(t.category, t.type)}
                      {t.category}
                    </span>
                  </td>
                  {/* Notes */}
                  <td className="px-6 py-4.5 max-w-xs truncate font-medium text-zinc-300">
                    {t.notes || <span className="text-zinc-600 font-normal italic">No notes</span>}
                  </td>
                  {/* Payment Method */}
                  <td className="px-6 py-4.5 hidden sm:table-cell whitespace-nowrap text-zinc-400">
                    {t.type === 'expense' ? (
                      renderPaymentMethodBadge(t.paymentMethod || 'Credit Card')
                    ) : (
                      <span className="text-xs text-zinc-600 font-semibold uppercase tracking-wider">—</span>
                    )}
                  </td>
                  {/* Amount */}
                  <td className={`px-6 py-4.5 text-right font-bold text-base whitespace-nowrap ${
                    t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatVal(t.amount)}
                  </td>
                  {/* Actions */}
                  <td className="px-6 py-4.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingTransaction(t)}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                        title="Edit entry"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search size={32} className="text-zinc-700 animate-pulse" />
                      <p className="font-semibold">No transactions found</p>
                      <p className="text-xs text-zinc-600">Try adjusting your search terms or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white/[0.01] border-t border-white/5">
            <span className="text-xs font-semibold text-zinc-500">
              Page {currentPage} of {totalPages} ({filteredTransactions.length} entries)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-white/5 hover:border-white/10 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-white/5 hover:border-white/10 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline edit transaction modal */}
      {editingTransaction && (
        <TransactionModal 
          transactionToEdit={editingTransaction} 
          onClose={() => setEditingTransaction(null)} 
        />
      )}
    </div>
  );
};
export default Transactions;
