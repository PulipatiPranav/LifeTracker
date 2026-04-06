import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Modal, StatCard, Tabs, EmptyState, ChartTooltip } from '@/components/ui';
import { today, mean, last7Days, last30Days, last90Days, formatDate } from '@/utils/helpers';
import { Moon, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

export default function SleepPage() {
  const { data, addSleepEntry, deleteSleepEntry } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [range, setRange] = useState('7d');
  const [formDate, setFormDate] = useState(today());
  const [formBedtime, setFormBedtime] = useState('23:00');
  const [formWakeTime, setFormWakeTime] = useState('07:00');

  const calculateDuration = (bed: string, wake: string): number => {
    const [bh, bm] = bed.split(':').map(Number);
    const [wh, wm] = wake.split(':').map(Number);
    let bedMin = bh * 60 + bm;
    let wakeMin = wh * 60 + wm;
    if (wakeMin <= bedMin) wakeMin += 24 * 60;
    return (wakeMin - bedMin) / 60;
  };

  const handleAdd = () => {
    const duration = calculateDuration(formBedtime, formWakeTime);
    const isAnomaly = duration < 5 || duration > 10 || parseInt(formBedtime.split(':')[0]) >= 1;
    let anomalyType: 'late_night' | 'short_sleep' | 'oversleep' | undefined;
    if (parseInt(formBedtime.split(':')[0]) >= 1 && parseInt(formBedtime.split(':')[0]) < 12) anomalyType = 'late_night';
    else if (duration < 5) anomalyType = 'short_sleep';
    else if (duration > 10) anomalyType = 'oversleep';

    addSleepEntry({
      date: formDate,
      bedtime: formBedtime,
      wakeTime: formWakeTime,
      duration,
      isAnomaly: isAnomaly && !!anomalyType,
      anomalyType,
    });
    setShowAdd(false);
  };

  const days = range === '7d' ? last7Days() : range === '30d' ? last30Days() : last90Days();

  const chartData = useMemo(() => {
    return days.map(date => {
      const entry = data.sleep.find(s => s.date === date);
      return {
        date: formatDate(date),
        fullDate: date,
        duration: entry?.duration ? Math.round(entry.duration * 10) / 10 : null,
        isAnomaly: entry?.isAnomaly || false,
        bedtime: entry?.bedtime || '',
        wakeTime: entry?.wakeTime || '',
      };
    });
  }, [data.sleep, range]);

  const avgDuration = useMemo(() => {
    const vals = data.sleep.filter(s => days.includes(s.date)).map(s => s.duration);
    return vals.length ? mean(vals) : 0;
  }, [data.sleep, days]);

  const sleepScore = useMemo(() => {
    if (avgDuration === 0) return 0;
    // Optimal sleep: 7-9 hours
    if (avgDuration >= 7 && avgDuration <= 9) return Math.round(90 + (avgDuration - 7) * 5);
    if (avgDuration >= 6 && avgDuration < 7) return Math.round(70 + (avgDuration - 6) * 20);
    if (avgDuration > 9) return Math.round(90 - (avgDuration - 9) * 10);
    return Math.round(Math.max(30, avgDuration * 10));
  }, [avgDuration]);

  return (
    <div>
      <PageHeader
        title="Sleep"
        subtitle="Track your sleep patterns"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Log Sleep</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Avg Duration" value={`${avgDuration.toFixed(1)}h`} icon={<Moon size={20} className="text-indigo-400" />} />
        <StatCard label="Sleep Score" value={sleepScore} subtitle="/100" color={sleepScore >= 80 ? 'text-[var(--color-good)]' : sleepScore >= 60 ? 'text-[var(--color-warning)]' : 'text-[var(--color-bad)]'} />
        <StatCard label="Entries" value={data.sleep.filter(s => days.includes(s.date)).length} subtitle={`last ${range}`} />
        <StatCard label="Last Night" value={data.sleep.length > 0 ? `${data.sleep.sort((a, b) => b.date.localeCompare(a.date))[0].duration.toFixed(1)}h` : '—'} />
      </div>

      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">Sleep Duration</h3>
          <Tabs tabs={['7d', '30d', '90d']} active={range} onChange={setRange} />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={range === '90d' ? 13 : range === '30d' ? 4 : 0} />
            <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}h`} />
            <Tooltip content={<ChartTooltip formatter={(v: number) => `${v}h`} />} />
            <Area type="monotone" dataKey="duration" stroke="#818cf8" fill="url(#sleepGrad)" strokeWidth={2} connectNulls dot={false} />
            {chartData.filter(d => d.isAnomaly && d.duration).map((d, i) => (
              <ReferenceDot key={i} x={d.date} y={d.duration!} r={5} fill="#f87171" stroke="#f87171" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-tertiary)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#818cf8]" /> Duration</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f87171]" /> Anomaly</span>
        </div>
      </div>

      {/* Recent entries */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Recent Entries</h3>
        <div className="space-y-2">
          {data.sleep.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(entry => (
            <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--color-text-secondary)] w-16">{formatDate(entry.date)}</span>
                <span className="text-sm">{entry.bedtime} → {entry.wakeTime}</span>
                {entry.isAnomaly && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-bad-muted)] text-[var(--color-bad)]">{entry.anomalyType}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{entry.duration.toFixed(1)}h</span>
                <button onClick={() => deleteSleepEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-red-400 transition-all">✕</button>
              </div>
            </div>
          ))}
          {data.sleep.length === 0 && <p className="text-sm text-[var(--color-text-tertiary)]">No entries yet</p>}
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Sleep">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Bedtime</label>
              <input type="time" value={formBedtime} onChange={e => setFormBedtime(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Wake Time</label>
              <input type="time" value={formWakeTime} onChange={e => setFormWakeTime(e.target.value)} className="w-full" />
            </div>
          </div>
          <div className="text-center py-2">
            <span className="text-2xl font-bold">{calculateDuration(formBedtime, formWakeTime).toFixed(1)}h</span>
            <span className="text-sm text-[var(--color-text-secondary)] ml-2">sleep</span>
          </div>
          <Button onClick={handleAdd} className="w-full">Save</Button>
        </div>
      </Modal>
    </div>
  );
}
