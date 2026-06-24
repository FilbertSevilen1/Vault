import React from 'react';
import { useVaultStore, CURRENCY_SYMBOLS } from '../store/vaultStore';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/vaultDb';
import { 
  subMonths, 
  format, 
  startOfMonth, 
  endOfMonth, 
  parseISO, 
  isAfter, 
  isBefore,
  differenceInDays
} from 'date-fns';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  BadgePercent, 
  Scale, 
  Coins, 
  ChevronRight, 
  Sparkles 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currency, setActiveTab } = useVaultStore();
  const cSymbol = CURRENCY_SYMBOLS[currency] || '$';

  // Read transactions, investments and goals from DB
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const investments = useLiveQuery(() => db.investments.toArray()) || [];
  const goals = useLiveQuery(() => db.goals.toArray()) || [];

  // Helper: Format amounts to currency
  const formatVal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Dates definitions
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // 1. Calculate Earnings and Expenses
  const currentMonthTx = transactions.filter(t => {
    const tDate = parseISO(t.date);
    return !isBefore(tDate, currentMonthStart) && !isAfter(tDate, currentMonthEnd);
  });

  const lastMonthTx = transactions.filter(t => {
    const tDate = parseISO(t.date);
    return !isBefore(tDate, lastMonthStart) && !isAfter(tDate, lastMonthEnd);
  });

  const thisMonthIncome = currentMonthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const thisMonthExpense = currentMonthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const lastMonthIncome = lastMonthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const lastMonthExpense = lastMonthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // All-time totals
  const totalCashIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalCashExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const cashBalance = totalCashIncome - totalCashExpense;

  // Investment values
  const totalInvestmentValue = investments.reduce((sum, inv) => sum + (inv.currentValue * inv.quantity), 0);
  const totalInvestmentCost = investments.reduce((sum, inv) => sum + (inv.buyPrice * inv.quantity), 0);
  const investmentProfitLoss = totalInvestmentValue - totalInvestmentCost;
  const investmentProfitPct = totalInvestmentCost > 0 ? (investmentProfitLoss / totalInvestmentCost) * 100 : 0;

  // Net Worth
  const netWorth = cashBalance + totalInvestmentValue;

  // Monthly stats
  const monthlySavingsRate = thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100 : 0;
  const monthlyCashFlow = thisMonthIncome - thisMonthExpense;

  // Comparisons
  const incomeDiff = thisMonthIncome - lastMonthIncome;
  const incomeChangePct = lastMonthIncome > 0 ? (incomeDiff / lastMonthIncome) * 100 : 0;

  const expenseDiff = thisMonthExpense - lastMonthExpense;
  const expenseChangePct = lastMonthExpense > 0 ? (expenseDiff / lastMonthExpense) * 100 : 0;

  // 2. Prepare 12-Month Trends Data
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    return {
      dateObj: d,
      monthLabel: format(d, 'MMM yy'),
      income: 0,
      expense: 0,
      cashflow: 0,
      cumulativeCash: 0,
      investments: 0,
      netWorth: 0
    };
  });

  // Calculate monthly aggregations
  last12Months.forEach((m) => {
    const mStart = startOfMonth(m.dateObj);
    const mEnd = endOfMonth(m.dateObj);
    
    const mTx = transactions.filter(t => {
      const tDate = parseISO(t.date);
      return !isBefore(tDate, mStart) && !isAfter(tDate, mEnd);
    });

    m.income = mTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    m.expense = mTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    m.cashflow = m.income - m.expense;
  });

  // Calculate cumulative balances & simulate investment valuations month by month
  
  // Calculate backward rolling cash
  let currentAccumulated = cashBalance;
  for (let i = 11; i >= 0; i--) {
    last12Months[i].cumulativeCash = currentAccumulated;
    currentAccumulated -= last12Months[i].cashflow;
  }

  // Simulate investments progress over the 12 months based on purchaseDate
  last12Months.forEach((m) => {
    const mEnd = endOfMonth(m.dateObj);
    
    // Sum of assets bought before/during this month
    const validInvestments = investments.filter(inv => {
      const pDate = parseISO(inv.purchaseDate);
      return !isAfter(pDate, mEnd);
    });

    const costBasisAtMonth = validInvestments.reduce((sum, inv) => sum + (inv.buyPrice * inv.quantity), 0);
    
    // Simulate growth: apply a randomized market growth multiplier based on months back
    const monthsBack = differenceInDays(now, mEnd) / 30;
    // We scale down the market gain backward in time
    const simulatedMultiplier = 1 + (investmentProfitLoss / (totalInvestmentCost || 1)) * (1 - monthsBack / 12);
    
    m.investments = costBasisAtMonth * Math.max(0.5, simulatedMultiplier);
    m.netWorth = m.cumulativeCash + m.investments;
  });

  // 3. Insight values
  const expensesList = transactions.filter(t => t.type === 'expense');
  const incomesList = transactions.filter(t => t.type === 'income');

  // Find biggest category
  const expenseByCat: Record<string, number> = {};
  expensesList.forEach(e => { expenseByCat[e.category] = (expenseByCat[e.category] || 0) + e.amount; });
  let biggestCat = 'N/A';
  let biggestCatAmt = 0;
  Object.entries(expenseByCat).forEach(([cat, amt]) => {
    if (amt > biggestCatAmt) {
      biggestCat = cat;
      biggestCatAmt = amt;
    }
  });

  // Find highest income source
  const incomeBySource: Record<string, number> = {};
  incomesList.forEach(i => { incomeBySource[i.category] = (incomeBySource[i.category] || 0) + i.amount; });
  let topSource = 'N/A';
  let topSourceAmt = 0;
  Object.entries(incomeBySource).forEach(([src, amt]) => {
    if (amt > topSourceAmt) {
      topSource = src;
      topSourceAmt = amt;
    }
  });

  // Averages
  const activeMonths = Math.max(1, last12Months.filter(m => m.income > 0 || m.expense > 0).length);
  const avgMonthlyIncome = totalCashIncome / activeMonths;
  const avgMonthlyExpense = totalCashExpense / activeMonths;

  return (
    <div className="space-y-6">
      {/* 1. KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3 text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Net Worth</span>
            <Wallet size={16} className="text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{formatVal(netWorth)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium">
            <span className="text-zinc-500">Cash + Investments</span>
          </div>
        </div>

        {/* Total Cash Balance */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3 text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Cash Balance</span>
            <Coins size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{formatVal(cashBalance)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-zinc-500">
            <span>Liquid Account Funds</span>
          </div>
        </div>

        {/* Total Investments */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3 text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Investments</span>
            <Scale size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{formatVal(totalInvestmentValue)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold">
            {investmentProfitLoss >= 0 ? (
              <span className="flex items-center gap-0.5 text-emerald-400">
                <ArrowUpRight size={14} /> +{investmentProfitPct.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-rose-400">
                <ArrowDownRight size={14} /> {investmentProfitPct.toFixed(1)}%
              </span>
            )}
            <span className="text-zinc-500 font-normal">ROI growth</span>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="glass-panel p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3 text-zinc-500">
            <span className="text-xs font-bold uppercase tracking-wider">Savings Rate</span>
            <BadgePercent size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{monthlySavingsRate.toFixed(1)}%</div>
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold">
            {monthlyCashFlow >= 0 ? (
              <span className="flex items-center gap-0.5 text-emerald-400">
                <TrendingUp size={12} /> +{formatVal(monthlyCashFlow)}
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-rose-400">
                <TrendingDown size={12} /> {formatVal(monthlyCashFlow)}
              </span>
            )}
            <span className="text-zinc-500 font-normal">Cashflow this month</span>
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Growth (Line Chart) */}
        <div className="glass-panel p-5 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Net Worth Growth</h3>
            <p className="text-xs text-zinc-500">Total assets evaluation over 12 months</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last12Months} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="netWorthGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="monthLabel" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${cSymbol}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                  labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }} 
                  itemStyle={{ color: '#c084fc', fontSize: 12 }}
                  formatter={(v: any) => [formatVal(v), 'Net Worth']}
                />
                <Area type="monotone" dataKey="netWorth" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#netWorthGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Investment Growth (Line Chart) */}
        <div className="glass-panel p-5 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Investment Growth</h3>
            <p className="text-xs text-zinc-500">Portfolio values over 12 months</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last12Months} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="investmentsGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="monthLabel" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${cSymbol}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                  labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }} 
                  itemStyle={{ color: '#60a5fa', fontSize: 12 }}
                  formatter={(v: any) => [formatVal(v), 'Portfolio Valuation']}
                />
                <Area type="monotone" dataKey="investments" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#investmentsGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Trends (Bar Chart) */}
        <div className="glass-panel p-5 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Spending Trends</h3>
            <p className="text-xs text-zinc-500">Monthly total expenditures</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last12Months} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="monthLabel" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${cSymbol}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                  labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }} 
                  itemStyle={{ color: '#f43f5e', fontSize: 12 }}
                  formatter={(v: any) => [formatVal(v), 'Expenses']}
                />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Trends (Bar Chart) */}
        <div className="glass-panel p-5 flex flex-col h-80">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Income Trends</h3>
            <p className="text-xs text-zinc-500">Monthly earnings streams</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last12Months} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="monthLabel" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${cSymbol}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.95)', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                  labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }} 
                  itemStyle={{ color: '#10b981', fontSize: 12 }}
                  formatter={(v: any) => [formatVal(v), 'Income']}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Monthly comparisons & quick insights & Goals summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Comparison card */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Performance Audit</h3>
          
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-xs text-zinc-500">Monthly Earnings</p>
                <p className="text-base font-bold text-white mt-0.5">{formatVal(thisMonthIncome)}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold ${
                  incomeChangePct >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {incomeChangePct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(incomeChangePct).toFixed(0)}%
                </span>
                <p className="text-[10px] text-zinc-500 mt-1">vs last month</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-xs text-zinc-500">Monthly Expenses</p>
                <p className="text-base font-bold text-white mt-0.5">{formatVal(thisMonthExpense)}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold ${
                  expenseChangePct <= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {expenseChangePct <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  {Math.abs(expenseChangePct).toFixed(0)}%
                </span>
                <p className="text-[10px] text-zinc-500 mt-1">vs last month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick insights card */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vault Insights</h3>
          </div>
          
          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center py-0.5 border-b border-white/5 pb-2">
              <span className="text-zinc-500">Top Expense Category</span>
              <span className="font-semibold text-white">{biggestCat} ({formatVal(biggestCatAmt)})</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-white/5 pb-2">
              <span className="text-zinc-500">Top Earning Source</span>
              <span className="font-semibold text-emerald-400">{topSource} ({formatVal(topSourceAmt)})</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-white/5 pb-2">
              <span className="text-zinc-500">Avg Monthly Earning</span>
              <span className="font-semibold text-white">{formatVal(avgMonthlyIncome)}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-500">Avg Monthly Spend</span>
              <span className="font-semibold text-white">{formatVal(avgMonthlyExpense)}</span>
            </div>
          </div>
        </div>

        {/* Savings Goals brief progress */}
        <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Savings Forecast</h3>
            <p className="text-xs text-zinc-500 mb-4">Immediate active goals</p>
            
            <div className="space-y-3">
              {goals.slice(0, 2).map(goal => {
                const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                return (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-300">{goal.name}</span>
                      <span className="text-zinc-400">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 border border-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <div className="text-zinc-600 text-xs py-4 text-center">
                  No active goals set.
                </div>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => setActiveTab('goals')}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            Manage Targets
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
