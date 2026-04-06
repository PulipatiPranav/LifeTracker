import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Modal, StatCard, Tabs, ChartTooltip } from '@/components/ui';
import { today, mean, last7Days, last30Days, formatDate } from '@/utils/helpers';
import { Smartphone, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ScreenCategory } from '@/types';

const screenCats: ScreenCategory[] = ['Social Media', 'Work/Study', 'Entertainment', 'Other'];
const catColors: Record<string, string> = {
  'Social Media': '#f87171',
  'Work/Study': '#818cf8',
  'Entertainment': '#fbbf24',
  'Other': '#71717a',
};

export default function ScreentimePage() {
  const { data, addScreentimeEntry } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [range, setRange] = useState('7d');
  const [formDate, setFormDate] = useState(today());
  const [formCats, setFormCats] = useState<Record<ScreenCategory, number>>({
    'Social Media': 0, 'Work/Study': 0, 'Entertainment': 0, 'Other': 0,
  });

  const handleAdd = () => {
    const total = Object.values(formCats).reduce((s, v) => s + v, 0);
    addScreentimeEntry({ date: formDate, categories: { ...formCats }, total });
    setShowAdd(false);
    setFormCats({ 'Social Media': 0, 'Work/Study': 0, 'Entertainment': 0, 'Other': 0 });
  };

  const days = range === '7d' ? last7Days() : last30Days();

  const chartData = useMemo(() => {
    return days.map(date => {
      const entry = data.screentime.find(s => s.date === date);
      return {
        date: formatDate(date),
        ...Object.fromEntries(screenCats.map(c => [c, entry?.categories[c] || 0])),
        total: entry?.total || 0,
      };
    });
  }, [data.screentime, range]);

  const avgDaily = useMemo(() => {
    const vals = data.screentime.filter(s => days.includes(s.date)).map(s => s.total);
    return vals.length ? mean(vals) : 0;
  }, [data.screentime, days]);

  const todayEntry = data.screentime.find(s => s.date === today());

  return (
    <div>
      <PageHeader
        title="Screen Time"
        subtitle="Monitor your digital consumption"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Log Screen Time</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Today" value={todayEntry ? `${Math.floor(todayEntry.total / 60)}h ${todayEntry.total % 60}m` : '—'} icon={<Smartphone size={20} className="text-purple-400" />} />
        <StatCard label="Daily Avg" value={`${Math.floor(avgDaily / 60)}h ${Math.round(avgDaily % 60)}m`} subtitle={`last ${range}`} />
        <StatCard label="Weekly Avg" value={`${Math.round(avgDaily * 7 / 60)}h`} subtitle="total" />
        <StatCard label="Entries" value={data.screentime.filter(s => days.includes(s.date)).length} />
      </div>

      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">Screen Time by Category</h3>
          <Tabs tabs={['7d', '30d']} active={range} onChange={setRange} />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.floor(v / 60)}h`} />
            <Tooltip content={<ChartTooltip formatter={(v: number) => `${Math.floor(v / 60)}h ${v % 60}m`} />} />
            {screenCats.map(cat => (
              <Bar key={cat} dataKey={cat} stackId="a" fill={catColors[cat]} radius={cat === 'Other' ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2">
          {screenCats.map(cat => (
            <span key={cat} className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColors[cat] }} />
              {cat}
            </span>
          ))}
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Screen Time">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full" />
          </div>
          {screenCats.map(cat => (
            <div key={cat}>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">{cat} (minutes)</label>
              <input
                type="number"
                min={0}
                value={formCats[cat]}
                onChange={e => setFormCats(prev => ({ ...prev, [cat]: parseInt(e.target.value) || 0 }))}
                className="w-full"
              />
            </div>
          ))}
          <div className="text-center py-2">
            <span className="text-2xl font-bold">{Math.floor(Object.values(formCats).reduce((s, v) => s + v, 0) / 60)}h {Object.values(formCats).reduce((s, v) => s + v, 0) % 60}m</span>
            <span className="text-sm text-[var(--color-text-secondary)] ml-2">total</span>
          </div>
          <Button onClick={handleAdd} className="w-full">Save</Button>
        </div>
      </Modal>
    </div>
  );
}
