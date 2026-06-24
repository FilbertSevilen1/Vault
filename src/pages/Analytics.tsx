import React, { useState } from 'react';
import { useVaultStore, CURRENCY_SYMBOLS } from '../store/vaultStore';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/vaultDb';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  format, 
  subDays, 
  parseISO, 
  startOfMonth, 
  eachDayOfInterval
} from 'date-fns';

export const Analytics: React.FC = () => {
  const { currency } = useVaultStore();
  const cSymbol = CURRENCY_SYMBOLS[currency] || '$';

  // State management
  const [timeframe, setTimeframe] = useState<'30days' | '6months' | '12months'>('6months');
  const [breakdownType, setBreakdownType] = useState<'expense' | 'income'>('expense');

  // Load transactions
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];

  // Currency format helper
  const formatVal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter transactions based on timeframe
  const today = new Date();
  let startDate = subDays(today, 180); // Default 6 months
  if (timeframe === '30days') startDate = subDays(today, 30);
  if (timeframe === '12months') startDate = subDays(today, 365);

  const filteredTx = transactions.filter(t => parseISO(t.date) >= startDate);

  // 1. Group by Month for Cash Flow (Income vs Expenses) Area Chart
  const monthlyDataMap: Record<string, { monthLabel: string, income: number, expense: number, savings: number }> = {};
  
  // Initialize months in order
  const monthCount = timeframe === '30days' ? 1 : timeframe === '6months' ? 6 : 12;
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = subDays(today, i * 30);
    const key = format(d, 'yyyy-MM');
    monthlyDataMap[key] = {
      monthLabel: format(d, 'MMM yy'),
      income: 0,
      expense: 0,
      savings: 0
    };
  }

  // Populate data
  transactions.forEach(t => {
    const key = t.date.substring(0, 7); // YYYY-MM
    if (monthlyDataMap[key]) {
      if (t.type === 'income') {
        monthlyDataMap[key].income += t.amount;
      } else {
        monthlyDataMap[key].expense += t.amount;
      }
      monthlyDataMap[key].savings = monthlyDataMap[key].income - monthlyDataMap[key].expense;
    }
  });

  const cashFlowData = Object.values(monthlyDataMap);

  // 2. Group by Category for Pie Chart
  const categoryMap: Record<string, number> = {};
  filteredTx.filter(t => t.type === breakdownType).forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const COLORS = [
    '#8b5cf6', // Violet
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#f43f5e', // Rose
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#f97316', // Orange
    '#a1a1aa'  // Zinc
  ];

  const categoryPieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  // 3. Daily Spending Breakdown (Current Month)
  const currentMonthDays = eachDayOfInterval({
    start: startOfMonth(today),
    end: today
  });

  const dailyData = currentMonthDays.map(day => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    const dayTx = transactions.filter(t => t.date === formattedDate);
    const spending = dayTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const earnings = dayTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    return {
      dayLabel: format(day, 'dd'),
      spending,
      earnings
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Filter controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/20 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Advanced Financial Analytics</h2>
          <p className="text-xs text-zinc-500 font-medium">Deep-dive analysis of spending patterns and savings ratios</p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
          {(['30days', '6months', '12months'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-white text-black font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tf === '30days' ? '30 Days' : tf === '6months' ? '6 Months' : '12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top Charts Row: Cash Flow area map & Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cashflow Trends double Area */}
        <div className="glass-panel p-5 flex flex-col h-80 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Monthly Cash Flow</h3>
            <p className="text-xs text-zinc-500">Earnings vs Expenses comparisons</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="monthLabel" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${cSymbol}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <ChartTooltip 
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                  labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }} 
                  itemStyle={{ fontSize: 11 }}
                  formatter={(v: any) => [formatVal(v)]}
                />
                <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                <Area name="Earnings" type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGlow)" />
                <Area name="Expenses" type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expenseGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="glass-panel p-5 flex flex-col h-80">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Allocation</h3>
              <p className="text-xs text-zinc-500">Distribution by type</p>
            </div>
            
            {/* Category type switcher */}
            <div className="flex items-center gap-1.5 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <button
                onClick={() => setBreakdownType('expense')}
                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                  breakdownType === 'expense'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Spend
              </button>
              <button
                onClick={() => setBreakdownType('income')}
                className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                  breakdownType === 'income'
                    ? 'bg-emerald-500 text-black shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Earn
              </button>
            </div>
          </div>

          {categoryPieData.length > 0 ? (
            <div className="flex-1 min-h-0 flex flex-col justify-center items-center">
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={58}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                      labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }} 
                      itemStyle={{ color: '#fff', fontSize: 11 }}
                      formatter={(v: any) => [formatVal(v)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Pie labels list */}
              <div className="w-full flex items-center justify-center flex-wrap gap-x-3 gap-y-1.5 overflow-y-auto max-h-16 pt-2">
                {categoryPieData.slice(0, 4).map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>{entry.name} ({((entry.value / categoryPieData.reduce((sum, c) => sum + c.value, 0)) * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-zinc-600 text-xs py-16 flex-1 flex items-center justify-center">
              No transactions recorded in timeframe.
            </div>
          )}
        </div>

      </div>

      {/* 3. Daily Spending / Earning Details (Current Month) */}
      <div className="glass-panel p-5 flex flex-col h-80">
        <div className="mb-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Daily Spending Flow</h3>
          <p className="text-xs text-zinc-500">Day-by-day cash fluctuations this month</p>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="dayLabel" stroke="#4b5563" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="#4b5563" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${cSymbol}${v}`} />
              <ChartTooltip 
                contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }} 
                itemStyle={{ fontSize: 11 }}
                formatter={(v: any) => [formatVal(v)]}
              />
              <Legend verticalAlign="top" height={32} iconSize={8} wrapperStyle={{ fontSize: 9, fontWeight: 'bold' }} />
              <Bar name="Spend" dataKey="spending" fill="#f43f5e" radius={[2, 2, 0, 0]} maxBarSize={15} />
              <Bar name="Earn" dataKey="earnings" fill="#10b981" radius={[2, 2, 0, 0]} maxBarSize={15} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
export default Analytics;
