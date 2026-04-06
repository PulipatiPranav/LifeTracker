import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Modal, StatCard, Tabs, ChartTooltip } from '@/components/ui';
import { today, mean, last30Days, last90Days, formatDate } from '@/utils/helpers';
import { Scale, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function BodyMetricsPage() {
  const { data, addBodyMetricsEntry } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [range, setRange] = useState('30d');
  const [formDate, setFormDate] = useState(today());
  const [formWeight, setFormWeight] = useState(70);
  const [formBodyFat, setFormBodyFat] = useState<number | ''>('');
  const [formHeight, setFormHeight] = useState(170);

  const handleAdd = () => {
    const bmi = formHeight > 0 ? Math.round((formWeight / ((formHeight / 100) ** 2)) * 10) / 10 : undefined;
    addBodyMetricsEntry({
      date: formDate,
      weight: formWeight,
      bodyFat: formBodyFat !== '' ? formBodyFat : undefined,
      bmi,
    });
    setShowAdd(false);
  };

  const days = range === '30d' ? last30Days() : last90Days();

  const chartData = useMemo(() => {
    return days.map(date => {
      const entry = data.bodyMetrics.find(b => b.date === date);
      return {
        date: formatDate(date),
        weight: entry?.weight || null,
        bodyFat: entry?.bodyFat || null,
      };
    });
  }, [data.bodyMetrics, range]);

  const latest = data.bodyMetrics.sort((a, b) => b.date.localeCompare(a.date))[0];
  const avgWeight = useMemo(() => {
    const vals = data.bodyMetrics.filter(b => days.includes(b.date)).map(b => b.weight);
    return vals.length ? mean(vals) : 0;
  }, [data.bodyMetrics, days]);

  // Trend (simple: compare first half avg to second half avg)
  const trend = useMemo(() => {
    const entries = data.bodyMetrics.filter(b => days.includes(b.date)).sort((a, b) => a.date.localeCompare(b.date));
    if (entries.length < 4) return null;
    const mid = Math.floor(entries.length / 2);
    const firstHalf = mean(entries.slice(0, mid).map(e => e.weight));
    const secondHalf = mean(entries.slice(mid).map(e => e.weight));
    return secondHalf - firstHalf;
  }, [data.bodyMetrics, days]);

  return (
    <div>
      <PageHeader
        title="Body Metrics"
        subtitle="Track weight and body composition"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Log Metrics</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Current Weight" value={latest ? `${latest.weight}kg` : '—'} icon={<Scale size={20} className="text-teal-400" />} />
        <StatCard label="Body Fat" value={latest?.bodyFat ? `${latest.bodyFat}%` : '—'} />
        <StatCard label="BMI" value={latest?.bmi ? latest.bmi.toFixed(1) : '—'} subtitle={latest?.bmi ? (latest.bmi < 18.5 ? 'Underweight' : latest.bmi < 25 ? 'Normal' : latest.bmi < 30 ? 'Overweight' : 'Obese') : ''} />
        <StatCard label="Trend" value={trend !== null ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}kg` : '—'} color={trend !== null ? (trend > 0 ? 'text-[var(--color-bad)]' : 'text-[var(--color-good)]') : ''} />
      </div>

      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">Weight Over Time</h3>
          <Tabs tabs={['30d', '90d']} active={range} onChange={setRange} />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={range === '90d' ? 13 : 4} />
            <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} tickFormatter={v => `${v}kg`} />
            <Tooltip content={<ChartTooltip formatter={(v: number) => `${v}kg`} />} />
            <Line type="monotone" dataKey="weight" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 3, fill: '#2dd4bf' }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.bodyMetrics.some(b => b.bodyFat) && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Body Fat %</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={range === '90d' ? 13 : 4} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 40]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip formatter={(v: number) => `${v}%`} />} />
              <Line type="monotone" dataKey="bodyFat" stroke="#f87171" strokeWidth={2} dot={{ r: 3, fill: '#f87171' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Body Metrics">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Weight (kg)</label>
            <input type="number" step="0.1" value={formWeight} onChange={e => setFormWeight(parseFloat(e.target.value) || 0)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Body Fat % (optional)</label>
            <input type="number" step="0.1" value={formBodyFat} onChange={e => setFormBodyFat(e.target.value ? parseFloat(e.target.value) : '')} className="w-full" placeholder="Optional" />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Height (cm) — for BMI</label>
            <input type="number" value={formHeight} onChange={e => setFormHeight(parseInt(e.target.value) || 0)} className="w-full" />
          </div>
          <Button onClick={handleAdd} className="w-full">Save</Button>
        </div>
      </Modal>
    </div>
  );
}
