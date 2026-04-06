import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { PageHeader, StatCard, ProgressRing, ChartTooltip } from '@/components/ui';
import { today, last7Days, mean, formatDate } from '@/utils/helpers';
import { Droplets, Plus, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function HydrationPage() {
  const { data, incrementWater, decrementWater } = useStore();
  const todayStr = today();
  const todayEntry = data.hydration.find(h => h.date === todayStr);
  const glasses = todayEntry?.glasses ?? 0;
  const goal = todayEntry?.goal ?? 8;

  const days = last7Days();
  const chartData = useMemo(() => {
    return days.map(date => {
      const entry = data.hydration.find(h => h.date === date);
      return {
        date: formatDate(date),
        glasses: entry?.glasses || 0,
        goal: entry?.goal || 8,
      };
    });
  }, [data.hydration]);

  const avgGlasses = useMemo(() => {
    const vals = data.hydration.filter(h => days.includes(h.date)).map(h => h.glasses);
    return vals.length ? mean(vals) : 0;
  }, [data.hydration]);

  const pct = goal > 0 ? Math.round((glasses / goal) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Hydration"
        subtitle="Stay hydrated, stay sharp"
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's tracker */}
        <div className="glass-card p-8 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-6">Today</h3>
          
          <ProgressRing value={glasses} max={goal} size={200} strokeWidth={12} color="#22d3ee">
            <div className="text-center">
              <motion.p
                key={glasses}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold"
              >
                {glasses}
              </motion.p>
              <p className="text-sm text-[var(--color-text-tertiary)]">of {goal} glasses</p>
            </div>
          </ProgressRing>

          <p className="mt-4 text-lg font-medium" style={{ color: pct >= 100 ? 'var(--color-good)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
            {pct >= 100 ? 'Goal reached! 🎉' : `${pct}% complete`}
          </p>

          <div className="flex items-center gap-6 mt-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => decrementWater(todayStr)}
              className="w-14 h-14 rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <Minus size={24} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => incrementWater(todayStr)}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-shadow"
            >
              <Plus size={32} className="text-white" />
            </motion.button>
            <div className="w-14 h-14 flex items-center justify-center">
              <Droplets size={24} className="text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Weekly stats */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Daily Avg" value={avgGlasses.toFixed(1)} subtitle="glasses" icon={<Droplets size={18} className="text-cyan-400" />} />
            <StatCard label="Today" value={`${glasses}/${goal}`} subtitle={pct >= 100 ? 'Complete ✓' : `${100 - pct}% to go`} />
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">This Week</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} glasses`} />} />
                <ReferenceLine y={8} stroke="var(--color-text-tertiary)" strokeDasharray="3 3" />
                <Bar dataKey="glasses" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
