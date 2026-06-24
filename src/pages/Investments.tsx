import React, { useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/vaultDb';
import type { Investment, AssetType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ChartTooltip 
} from 'recharts';
import { 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownRight, 
  X,
  PlusCircle
} from 'lucide-react';

export const Investments: React.FC = () => {
  const { currency, showConfirm } = useVaultStore();

  // Read investments from DB
  const investments = useLiveQuery(() => db.investments.toArray()) || [];

  // Local state for add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Investment | null>(null);

  // Form Fields
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('Stocks');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [buyPrice, setBuyPrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const assetTypes: AssetType[] = ['Stocks', 'ETFs', 'Crypto', 'Real Estate', 'Gold', 'Savings', 'Other'];

  // COLORS for allocation chart
  const COLORS = {
    Stocks: '#8b5cf6',      // Violet
    ETFs: '#3b82f6',        // Blue
    Crypto: '#f43f5e',      // Rose
    'Real Estate': '#10b981', // Emerald
    Gold: '#f59e0b',        // Amber
    Savings: '#06b6d4',     // Cyan
    Other: '#71717a'        // Zinc
  };

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setAssetName('');
    setAssetType('Stocks');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setBuyPrice('');
    setCurrentValue('');
    setQuantity('');
    setNotes('');
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (asset: Investment) => {
    setEditingAsset(asset);
    setAssetName(asset.assetName);
    setAssetType(asset.assetType);
    setPurchaseDate(asset.purchaseDate);
    setBuyPrice(asset.buyPrice.toString());
    setCurrentValue(asset.currentValue.toString());
    setQuantity(asset.quantity.toString());
    setNotes(asset.notes || '');
    setError('');
    setModalOpen(true);
  };

  const handleDelete = (id?: number) => {
    if (!id) return;
    showConfirm(
      'Delete Asset Holding',
      'Are you sure you want to delete this asset from your portfolio tracker?',
      async () => {
        await db.investments.delete(id);
      }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedBuyPrice = parseFloat(buyPrice);
    const parsedCurrentValue = parseFloat(currentValue);
    const parsedQuantity = parseFloat(quantity);

    if (!assetName.trim()) {
      setError('Asset name is required.');
      return;
    }
    if (isNaN(parsedBuyPrice) || parsedBuyPrice <= 0) {
      setError('Please enter a valid purchase price.');
      return;
    }
    if (isNaN(parsedCurrentValue) || parsedCurrentValue < 0) {
      setError('Please enter a valid current value.');
      return;
    }
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    const payload: Investment = {
      assetName: assetName.trim(),
      assetType,
      purchaseDate,
      buyPrice: parsedBuyPrice,
      currentValue: parsedCurrentValue,
      quantity: parsedQuantity,
      notes: notes.trim(),
    };

    try {
      if (editingAsset && editingAsset.id) {
        await db.investments.update(editingAsset.id, payload);
      } else {
        await db.investments.add(payload);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError('Failed to save investment.');
    }
  };

  // Calculations
  const totalCost = investments.reduce((sum, inv) => sum + (inv.buyPrice * inv.quantity), 0);
  const portfolioVal = investments.reduce((sum, inv) => sum + (inv.currentValue * inv.quantity), 0);
  const totalGain = portfolioVal - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Group by Asset Type for Allocation Donut Chart
  const allocationMap: Record<string, number> = {};
  investments.forEach((inv) => {
    const val = inv.currentValue * inv.quantity;
    allocationMap[inv.assetType] = (allocationMap[inv.assetType] || 0) + val;
  });

  const chartData = Object.entries(allocationMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Format helper
  const formatVal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Cards */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Asset Performance</h2>
          <p className="text-xs text-zinc-500">Track and evaluate manual portfolio holdings</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-white/5"
        >
          <PlusCircle size={14} />
          Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Portfolio Valuation */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Portfolio Value</p>
          <p className="text-2xl font-bold text-white tracking-tight">{formatVal(portfolioVal)}</p>
          <p className="text-xs text-zinc-500 mt-1">Cost basis: {formatVal(totalCost)}</p>
        </div>

        {/* Total Returns */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Total Gain / Loss</p>
          <p className={`text-2xl font-bold tracking-tight ${totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalGain >= 0 ? '+' : ''}{formatVal(totalGain)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs font-semibold">
            {totalGain >= 0 ? (
              <span className="flex items-center gap-0.5 text-emerald-400">
                <ArrowUpRight size={14} /> +{totalGainPct.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-rose-400">
                <ArrowDownRight size={14} /> {totalGainPct.toFixed(1)}%
              </span>
            )}
            <span className="text-zinc-500 font-normal">all-time returns</span>
          </div>
        </div>

        {/* Assets Count */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Total Holdings</p>
          <p className="text-2xl font-bold text-white tracking-tight">{investments.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Unique assets tracked</p>
        </div>
      </div>

      {/* 2. Visual Allocation & Ledger Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Allocation Donut Chart */}
        <div className="glass-panel p-5 flex flex-col items-center justify-center lg:col-span-1 h-80">
          <div className="w-full text-left mb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Asset Allocation</h3>
          </div>
          {chartData.length > 0 ? (
            <div className="w-full h-full flex flex-col justify-center items-center">
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#71717a'} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                      labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }} 
                      itemStyle={{ color: '#fff', fontSize: 11 }}
                      formatter={(v: any) => [formatVal(v), 'Asset Valuation']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5 mt-2">
                {chartData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }} 
                    />
                    <span>{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-zinc-600 text-xs py-10">
              No holdings found to chart.
            </div>
          )}
        </div>

        {/* Holdings List Table */}
        <div className="glass-panel lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Asset Listings</h3>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                  <th className="px-5 py-4">Asset</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4 text-right">Holdings</th>
                  <th className="px-5 py-4 text-right">Market Price</th>
                  <th className="px-5 py-4 text-right font-semibold">Total Value</th>
                  <th className="px-5 py-4 text-right">Profit / Loss</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-zinc-300 font-medium">
                {investments.map((inv) => {
                  const cost = inv.buyPrice * inv.quantity;
                  const currentVal = inv.currentValue * inv.quantity;
                  const gain = currentVal - cost;
                  const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
                  
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors">
                      {/* Name */}
                      <td className="px-5 py-4 text-zinc-200">
                        <p className="font-semibold text-white">{inv.assetName}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Purchased: {inv.purchaseDate}</p>
                      </td>
                      {/* Type Badge */}
                      <td className="px-5 py-4">
                        <span 
                          className="px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider uppercase"
                          style={{ 
                            color: COLORS[inv.assetType as keyof typeof COLORS], 
                            borderColor: `${COLORS[inv.assetType as keyof typeof COLORS]}30`,
                            backgroundColor: `${COLORS[inv.assetType as keyof typeof COLORS]}08`
                          }}
                        >
                          {inv.assetType}
                        </span>
                      </td>
                      {/* Quantity */}
                      <td className="px-5 py-4 text-right text-zinc-400 font-mono">
                        {inv.quantity}
                      </td>
                      {/* Price */}
                      <td className="px-5 py-4 text-right text-zinc-400 font-mono">
                        {formatVal(inv.currentValue)}
                        <p className="text-[10px] text-zinc-600 mt-0.5">Cost: {formatVal(inv.buyPrice)}</p>
                      </td>
                      {/* Valuation */}
                      <td className="px-5 py-4 text-right text-white font-bold font-mono">
                        {formatVal(currentVal)}
                      </td>
                      {/* Profit Loss */}
                      <td className={`px-5 py-4 text-right font-mono font-bold ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <p>{gain >= 0 ? '+' : ''}{formatVal(gain)}</p>
                        <p className="text-[10px] font-semibold mt-0.5">({gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)</p>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 rounded transition-all cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {investments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                      No investment holdings registered. Click Add Asset to start tracking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add / Edit Asset Modal */}
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
                {editingAsset ? 'Modify Asset holding' : 'Track New Asset'}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                {/* Asset Name */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Asset Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple Inc. or Bitcoin"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Asset Type */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Asset Type</span>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value as AssetType)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-zinc-300 text-sm focus:outline-none transition-all"
                    >
                      {assetTypes.map(type => (
                        <option key={type} value={type} className="bg-zinc-950">{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Purchase Date */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Purchase Date</span>
                    <input
                      type="date"
                      required
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-zinc-300 text-sm focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Buy Price */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Buy Price</span>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Price"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-white text-sm font-semibold focus:outline-none transition-all"
                    />
                  </div>

                  {/* Current Price */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Current Value</span>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Value"
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-white text-sm font-semibold focus:outline-none transition-all"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Quantity</span>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Qty"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-white text-sm font-semibold focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Notes / Holding Details</span>
                  <input
                    type="text"
                    placeholder="Short description of the asset"
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
                    {editingAsset ? 'Save Changes' : 'Record Holding'}
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
export default Investments;
