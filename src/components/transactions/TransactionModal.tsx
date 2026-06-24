import React, { useState, useEffect } from 'react';
import { useVaultStore } from '../../store/vaultStore';
import { motion } from 'framer-motion';
import { X, Sparkles, DollarSign, Calendar, Tag, CreditCard, AlignLeft } from 'lucide-react';
import type { Transaction } from '../../types';
import db from '../../db/vaultDb';

interface TransactionModalProps {
  transactionToEdit?: Transaction | null;
  onClose?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  transactionToEdit,
  onClose 
}) => {
  const { quickAddOpen, setQuickAddOpen } = useVaultStore();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [error, setError] = useState('');

  const expenseCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other'];
  const incomeSources = ['Salary', 'Freelance', 'Business', 'Investments', 'Other'];
  const paymentMethods = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Apple Pay'];

  // Sync edit values
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date);
      setNotes(transactionToEdit.notes || '');
      setPaymentMethod(transactionToEdit.paymentMethod || 'Credit Card');
    } else {
      // Defaults
      setType('expense');
      setAmount('');
      setCategory('Food');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setPaymentMethod('Credit Card');
    }
    setError('');
  }, [transactionToEdit, quickAddOpen]);

  // Adjust categories on type change
  useEffect(() => {
    if (!transactionToEdit) {
      setCategory(type === 'expense' ? 'Food' : 'Salary');
    }
  }, [type, transactionToEdit]);

  const handleQuickAddAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!category) {
      setError('Please select a category.');
      return;
    }

    const payload: Transaction = {
      type,
      amount: parsedAmount,
      category,
      date,
      notes: notes.trim(),
      ...(type === 'expense' ? { paymentMethod } : {})
    };

    try {
      if (transactionToEdit && transactionToEdit.id) {
        await db.transactions.update(transactionToEdit.id, payload);
      } else {
        await db.transactions.add(payload);
      }
      handleClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save transaction.');
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setQuickAddOpen(false);
    }
  };

  const isOpen = onClose ? true : quickAddOpen;

  if (!isOpen) return null;

  return (
    <div 
      id="transaction-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        id="transaction-modal"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass-panel p-6 relative shadow-2xl border border-white/10"
      >
        {/* Close Button */}
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/10">
            <Sparkles size={16} />
          </div>
          <h2 className="text-lg font-bold text-white">
            {transactionToEdit ? 'Edit Transaction' : 'Quick Add Transaction'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Type Selector (Expense vs Income) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950/60 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/15'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/15'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <DollarSign size={10} /> Amount
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-3 text-white placeholder-zinc-700 text-lg font-bold transition-all focus:outline-none"
                autoFocus
              />
            </div>
            {/* Quick value helpers */}
            <div className="flex gap-1.5 justify-end">
              {[10, 50, 100, 500].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleQuickAddAmount(v)}
                  className="px-2.5 py-1 text-[10px] font-bold rounded bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Tag size={10} /> Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3.5 py-2.5 text-zinc-300 text-sm font-medium transition-all focus:outline-none"
              >
                {type === 'expense'
                  ? expenseCategories.map((c) => <option key={c} value={c} className="bg-zinc-950">{c}</option>)
                  : incomeSources.map((c) => <option key={c} value={c} className="bg-zinc-950">{c}</option>)
                }
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Calendar size={10} /> Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3.5 py-2.5 text-zinc-300 text-sm font-medium transition-all focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method (Expense Only) */}
          {type === 'expense' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <CreditCard size={10} /> Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3.5 py-2.5 text-zinc-300 text-sm font-medium transition-all focus:outline-none"
              >
                {paymentMethods.map((pm) => (
                  <option key={pm} value={pm} className="bg-zinc-950">{pm}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <AlignLeft size={10} /> Notes
            </label>
            <input
              type="text"
              placeholder="e.g. weekly groceries shopping"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-4 py-2.5 text-zinc-300 text-sm placeholder-zinc-700 transition-all focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-1/3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-xl py-3 text-sm transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl py-3 text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {transactionToEdit ? 'Save Changes' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
