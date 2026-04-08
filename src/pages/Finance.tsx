import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Modal, StatCard, Tabs, EmptyState, ChartTooltip } from '@/components/ui';
import { today, mean, formatDate } from '@/utils/helpers';
import { Wallet, Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import type { SpendCategory } from '@/types';

const spendCategories: SpendCategory[] = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Other'];
const catColors: Record<string, string> = {
  Food: '#f87171', Transport: '#60a5fa', Entertainment: '#fbbf24',
  Shopping: '#a78bfa', Bills: '#f472b6', Health: '#34d399',
  Education: '#818cf8', Other: '#71717a',
};

export default function FinancePage() {
  const { data, addFinanceEntry, deleteFinanceEntry, setMonthlyBudget } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [formDate, setFormDate] = useState(today());
  const [formAmount, setFormAmount] = useState(0);
  const [formCategory, setFormCategory] = useState<SpendCategory>('Food');
  const [formDesc, setFormDesc] = useState('');
  const [budgetValues, setBudgetValues] = useState<Record<SpendCategory, number>>(
    Object.fromEntries(spendCategories.map(c => [c, 0])) as Record<SpendCategory, number>
  );

  const currentMonth = format(new Date(), 'yyyy-MM');

  const handleAdd = () => {
    if (formAmount <= 0) return;
    addFinanceEntry({ date: formDate, amount: formAmount, category: formCategory, description: formDesc });
    setShowAdd(false);
    setFormAmount(0);
    setFormDesc('');
  };

  const handleSetBudget = () => {
    setMonthlyBudget({ month: currentMonth, budgets: { ...budgetValues } });
    setShowBudget(false);
  };

  // Monthly spending by category
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const monthEntries = data.finance.filter(f => f.date >= monthStart && f.date <= monthEnd);
  const monthTotal = monthEntries.reduce((s, f) => s + f.amount, 0);

  const spendByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthEntries.forEach(f => {
      map[f.category] = (map[f.category] || 0) + f.amount;
    });
    return spendCategories.map(c => ({
      category: c,
      spent: map[c] || 0,
      budget: data.monthlyBudgets.find(b => b.month === currentMonth)?.budgets[c] || 0,
    }));
  }, [monthEntries, data.monthlyBudgets]);

  // Daily spending trend (last 30 days)
  const dailyTrend = useMemo(() => {
    const days = eachDayOfInterval({
      start: subMonths(new Date(), 1),
      end: new Date(),
    });
    return days.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayTotal = data.finance.filter(f => f.date === dateStr).reduce((s, f) => s + f.amount, 0);
      return { date: formatDate(dateStr), amount: dayTotal };
    });
  }, [data.finance]);

  const todaySpend = data.finance.filter(f => f.date === today()).reduce((s, f) => s + f.amount, 0);

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Track spending and budgets"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowBudget(true)}>Set Budget</Button>
            <Button onClick={() => setShowAdd(true)}><Plus size={16} /> Log Spend</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Today" value={`$${todaySpend.toFixed(0)}`} icon={<Wallet size={20} className="text-green-400" />} />
        <StatCard label="This Month" value={`$${monthTotal.toFixed(0)}`} />
        <StatCard label="Daily Avg" value={`$${(monthTotal / new Date().getDate()).toFixed(0)}`} subtitle="this month" />
        <StatCard label="Transactions" value={monthEntries.length} subtitle="this month" />
      </div>

      {/* Budget vs Actual */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Budget vs Actual — {format(new Date(), 'MMMM yyyy')}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={spendByCategory} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
            <Tooltip content={<ChartTooltip formatter={(v: number) => `$${v.toFixed(0)}`} />} />
            <Bar dataKey="budget" fill="var(--color-bg-hover)" radius={[0, 4, 4, 0]} name="Budget" />
            <Bar dataKey="spent" radius={[0, 4, 4, 0]} name="Spent">
              {spendByCategory.map((entry, i) => (
                <Cell key={i} fill={catColors[entry.category] || '#818cf8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily trend */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Daily Spending (30d)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyTrend}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <Tooltip content={<ChartTooltip formatter={(v: number) => `$${v.toFixed(0)}`} />} />
            <Bar dataKey="amount" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent transactions */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Recent Transactions</h3>
        {monthEntries.length === 0 ? (
          <EmptyState message="No transactions this month" icon={<Wallet size={48} />} />
        ) : (
          <div className="space-y-1">
            {[...monthEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20).map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColors[entry.category] }} />
                  <div>
                    <p className="text-sm">{entry.description || entry.category}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{formatDate(entry.date)} · {entry.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">${entry.amount.toFixed(2)}</span>
                  <button onClick={() => deleteFinanceEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Spending">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Amount ($)</label>
            <input type="number" step="0.01" value={formAmount || ''} onChange={e => setFormAmount(parseFloat(e.target.value) || 0)} className="w-full" autoFocus />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Category</label>
            <select value={formCategory} onChange={e => setFormCategory(e.target.value as SpendCategory)} className="w-full">
              {spendCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Description</label>
            <input value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full" placeholder="Optional" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </div>
          <Button onClick={handleAdd} className="w-full">Save</Button>
        </div>
      </Modal>

      {/* Budget Modal */}
      <Modal open={showBudget} onClose={() => setShowBudget(false)} title={`Set Budget — ${format(new Date(), 'MMMM yyyy')}`}>
        <div className="space-y-3">
          {spendCategories.map(cat => (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColors[cat] }} />
              <span className="text-sm flex-1">{cat}</span>
              <input
                type="number"
                value={budgetValues[cat] || ''}
                onChange={e => setBudgetValues(prev => ({ ...prev, [cat]: parseFloat(e.target.value) || 0 }))}
                className="w-24"
                placeholder="$0"
              />
            </div>
          ))}
          <Button onClick={handleSetBudget} className="w-full mt-4">Save Budget</Button>
        </div>
      </Modal>
    </div>
  );
}
