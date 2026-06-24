import React, { useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/vaultDb';
import type { Goal } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInMonths, isValid } from 'date-fns';
import { 
  Plus, 
  Target, 
  Calendar, 
  Trash2, 
  Edit3, 
  X,
  Compass, 
  Award
} from 'lucide-react';

export const Goals: React.FC = () => {
  const { currency, showConfirm } = useVaultStore();

  // Read goals from DB
  const goals = useLiveQuery(() => db.goals.toArray()) || [];

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline);
    setNotes(goal.notes || '');
    setError('');
    setModalOpen(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    showConfirm(
      'Delete Savings Target',
      'Are you sure you want to delete this savings goal target?',
      async () => {
        await db.goals.delete(id);
      }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount);

    if (!name.trim()) {
      setError('Goal name is required.');
      return;
    }
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Please enter a valid target amount.');
      return;
    }
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      setError('Please enter a valid current amount.');
      return;
    }

    const payload: Goal = {
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      deadline,
      notes: notes.trim()
    };

    try {
      if (editingGoal && editingGoal.id) {
        await db.goals.update(editingGoal.id, payload);
      } else {
        await db.goals.add(payload);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError('Failed to save savings goal.');
    }
  };

  const formatVal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Cards */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Savings Targets</h2>
          <p className="text-xs text-zinc-500">Fund future milestones and check projected timelines</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-white/5"
        >
          <Plus size={14} />
          Create Goal
        </button>
      </div>

      {/* 2. Grid list of Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const remaining = goal.targetAmount - goal.currentAmount;
          
          // Estimate monthly savings required
          let monthsRemaining = 0;
          let monthlyTarget = 0;
          const today = new Date();
          const targetDate = parseISO(goal.deadline);
          
          if (isValid(targetDate)) {
            monthsRemaining = differenceInMonths(targetDate, today);
            if (monthsRemaining > 0 && remaining > 0) {
              monthlyTarget = remaining / monthsRemaining;
            } else if (remaining > 0) {
              monthlyTarget = remaining; // Due within a month
            }
          }

          return (
            <motion.div 
              key={goal.id}
              layout
              className="glass-panel p-6 relative overflow-hidden flex flex-col justify-between h-72 border border-white/5 shadow-xl hover:border-white/10 transition-all duration-300"
            >
              {/* Top Row: Name and Actions */}
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <Target size={18} />
                    </div>
                    <span className="font-bold text-base text-white tracking-tight">{goal.name}</span>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Progress Stats */}
                <div className="mt-6 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Saved balance</span>
                    <span className="text-xl font-bold text-white tracking-tight">{formatVal(goal.currentAmount)}</span>
                    <span className="text-xs text-zinc-500 ml-1.5">of {formatVal(goal.targetAmount)}</span>
                  </div>
                  <span className="text-2xl font-bold text-violet-400 font-mono">{pct.toFixed(0)}%</span>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-zinc-950/60 border border-white/5 h-3 rounded-full overflow-hidden mt-3 relative">
                  <div 
                    className="bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Bottom Projection Insights */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Calendar size={12} /> Target Date</span>
                  <span className="font-semibold text-white">
                    {format(parseISO(goal.deadline), 'MMM dd, yyyy')}
                  </span>
                </div>
                
                {remaining > 0 ? (
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Compass size={12} /> Required Savings</span>
                    <span className="font-semibold text-emerald-400">
                      {monthlyTarget > 0 ? `${formatVal(monthlyTarget)} / month` : 'Fully funded!'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-lg">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider"><Award size={12} /> Milestone Reached!</span>
                    <span className="text-xs">100% Fund Complete</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full glass-panel py-16 text-center text-zinc-500 flex flex-col items-center justify-center space-y-3">
            <Target size={36} className="text-zinc-700 animate-bounce" />
            <h3 className="font-bold text-white">No Savings Targets Set</h3>
            <p className="text-xs max-w-xs text-zinc-600">Plan and track your milestones like emergency funds, new purchases or vacations here.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Goal Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md glass-panel p-6 relative border border-white/10 shadow-2xl"
            >
              <button 
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <h2 className="text-lg font-bold text-white mb-6">
                {editingGoal ? 'Update Savings Target' : 'Create Savings Target'}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                {/* Goal Name */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Goal Target Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emergency Fund or Japan Vacation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Target Amount */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Target Amount</span>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-white text-sm font-semibold focus:outline-none transition-all"
                    />
                  </div>

                  {/* Current Saved Amount */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Current Saved Amount</span>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-white text-sm font-semibold focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Target Date */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Target Milestone Date</span>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-zinc-300 text-sm focus:outline-none transition-all"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Notes / Details</span>
                  <input
                    type="text"
                    placeholder="Short description of this target"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-zinc-300 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="w-1/3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-xl py-3 text-sm cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl py-3 text-sm cursor-pointer transition-all"
                  >
                    {editingGoal ? 'Save Changes' : 'Initialize Target'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Goals;
