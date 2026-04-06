import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Modal, StatCard, Tabs, ChartTooltip } from '@/components/ui';
import { today, mean, last7Days, last30Days, last90Days, formatDate, moodEmojis, energyEmojis } from '@/utils/helpers';
import { Heart, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function MoodPage() {
  const { data, addMoodEntry } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [range, setRange] = useState('7d');
  const [formDate, setFormDate] = useState(today());
  const [formMood, setFormMood] = useState(3);
  const [formEnergy, setFormEnergy] = useState(3);

  const handleAdd = () => {
    addMoodEntry({ date: formDate, mood: formMood, energy: formEnergy });
    setShowAdd(false);
  };

  const days = range === '7d' ? last7Days() : range === '30d' ? last30Days() : last90Days();

  const chartData = useMemo(() => {
    return days.map(date => {
      const entry = data.mood.find(m => m.date === date);
      return {
        date: formatDate(date),
        mood: entry?.mood || null,
        energy: entry?.energy || null,
      };
    });
  }, [data.mood, range]);

  const todayEntry = data.mood.find(m => m.date === today());
  const avgMood = useMemo(() => {
    const vals = data.mood.filter(m => days.includes(m.date)).map(m => m.mood);
    return vals.length ? mean(vals) : 0;
  }, [data.mood, days]);
  const avgEnergy = useMemo(() => {
    const vals = data.mood.filter(m => days.includes(m.date)).map(m => m.energy);
    return vals.length ? mean(vals) : 0;
  }, [data.mood, days]);

  return (
    <div>
      <PageHeader
        title="Mood & Energy"
        subtitle="Track how you feel throughout your days"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Log Today</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Today's Mood" value={todayEntry ? moodEmojis[todayEntry.mood] : '—'} subtitle={todayEntry ? `${todayEntry.mood}/5` : 'Not logged'} icon={<Heart size={20} className="text-pink-400" />} />
        <StatCard label="Today's Energy" value={todayEntry ? energyEmojis[todayEntry.energy] : '—'} subtitle={todayEntry ? `${todayEntry.energy}/5` : 'Not logged'} />
        <StatCard label="Avg Mood" value={avgMood.toFixed(1)} subtitle={`last ${range}`} />
        <StatCard label="Avg Energy" value={avgEnergy.toFixed(1)} subtitle={`last ${range}`} />
      </div>

      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">Mood & Energy Over Time</h3>
          <Tabs tabs={['7d', '30d', '90d']} active={range} onChange={setRange} />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={range === '90d' ? 13 : range === '30d' ? 4 : 0} />
            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="mood" stroke="#ec4899" strokeWidth={2} dot={{ r: 3, fill: '#ec4899' }} connectNulls name="Mood" />
            <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} connectNulls name="Energy" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]"><span className="w-2 h-2 rounded-full bg-pink-500" /> Mood</span>
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]"><span className="w-2 h-2 rounded-full bg-amber-500" /> Energy</span>
        </div>
      </div>

      {/* Recent entries */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Recent Entries</h3>
        <div className="space-y-2">
          {data.mood.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map(entry => (
            <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors">
              <span className="text-sm text-[var(--color-text-secondary)] w-20">{formatDate(entry.date)}</span>
              <div className="flex items-center gap-4">
                <span className="text-lg">{moodEmojis[entry.mood]}</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">Mood {entry.mood}/5</span>
                <span className="text-lg">{energyEmojis[entry.energy]}</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">Energy {entry.energy}/5</span>
              </div>
            </div>
          ))}
          {data.mood.length === 0 && <p className="text-sm text-[var(--color-text-tertiary)]">No entries yet</p>}
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Mood & Energy">
        <div className="space-y-6">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">Mood</label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <motion.button
                  key={v}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFormMood(v)}
                  className={`flex-1 py-3 rounded-xl text-2xl transition-all ${
                    formMood === v ? 'bg-pink-500/20 ring-2 ring-pink-500 scale-110' : 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  {moodEmojis[v]}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-2 block">Energy</label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map(v => (
                <motion.button
                  key={v}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFormEnergy(v)}
                  className={`flex-1 py-3 rounded-xl text-2xl transition-all ${
                    formEnergy === v ? 'bg-amber-500/20 ring-2 ring-amber-500 scale-110' : 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  {energyEmojis[v]}
                </motion.button>
              ))}
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full">Save</Button>
        </div>
      </Modal>
    </div>
  );
}
