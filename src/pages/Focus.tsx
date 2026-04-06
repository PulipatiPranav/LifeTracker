import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, StatCard, Tabs, ChartTooltip } from '@/components/ui';
import { today, last7Days, mean, formatDate } from '@/utils/helpers';
import { Brain, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function FocusPage() {
  const { data, addFocusSession } = useStore();
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const todayStr = today();

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (!isBreak) {
        // Completed a work session
        addFocusSession(todayStr, {
          date: todayStr,
          startTime: new Date().toISOString(),
          duration: workDuration,
          type: 'pomodoro',
          completed: true,
        });
        setIsBreak(true);
        setTimeLeft(breakDuration * 60);
        setIsRunning(false);
      } else {
        setIsBreak(false);
        setTimeLeft(workDuration * 60);
        setIsRunning(false);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workDuration * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalPct = isBreak ? (breakDuration * 60 - timeLeft) / (breakDuration * 60) : (workDuration * 60 - timeLeft) / (workDuration * 60);
  const circumference = 2 * Math.PI * 90;

  // Weekly data
  const days = last7Days();
  const chartData = useMemo(() => {
    return days.map(date => {
      const entry = data.focus.find(f => f.date === date);
      return {
        date: formatDate(date),
        hours: entry ? Math.round(entry.totalMinutes / 60 * 10) / 10 : 0,
      };
    });
  }, [data.focus]);

  const todayFocus = data.focus.find(f => f.date === todayStr);
  const todayHours = todayFocus ? (todayFocus.totalMinutes / 60).toFixed(1) : '0';
  const weeklyTotal = useMemo(() => {
    return data.focus.filter(f => days.includes(f.date)).reduce((s, f) => s + f.totalMinutes, 0);
  }, [data.focus]);

  // Signal to noise: focus vs screentime
  const todayScreen = data.screentime.find(s => s.date === todayStr);
  const focusScreenRatio = todayFocus && todayScreen && todayScreen.total > 0
    ? (todayFocus.totalMinutes / todayScreen.total).toFixed(2)
    : '—';

  return (
    <div>
      <PageHeader title="Deep Work" subtitle="Focus timer and productivity tracking" />

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Timer */}
        <div className="glass-card p-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${isBreak ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[var(--color-accent-muted)] text-[var(--color-accent)]'}`}>
              {isBreak ? 'Break' : 'Focus'}
            </span>
            <button onClick={() => setShowSettings(!showSettings)} className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text)]">
              <Settings size={16} />
            </button>
          </div>

          {showSettings && (
            <div className="flex gap-3 mb-4">
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)]">Work (min)</label>
                <input type="number" value={workDuration} onChange={e => { setWorkDuration(parseInt(e.target.value) || 25); if (!isRunning) setTimeLeft((parseInt(e.target.value) || 25) * 60); }} className="w-20" />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)]">Break (min)</label>
                <input type="number" value={breakDuration} onChange={e => setBreakDuration(parseInt(e.target.value) || 5)} className="w-20" />
              </div>
            </div>
          )}

          <div className="relative w-52 h-52 mb-6">
            <svg width="208" height="208" className="transform -rotate-90">
              <circle cx="104" cy="104" r="90" fill="none" stroke="var(--color-bg-hover)" strokeWidth="8" />
              <motion.circle
                cx="104" cy="104" r="90"
                fill="none"
                stroke={isBreak ? '#34d399' : '#818cf8'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: circumference * (1 - totalPct) }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-mono">{formatTime(timeLeft)}</span>
              <span className="text-xs text-[var(--color-text-tertiary)] mt-1">{isBreak ? 'Break time' : 'Stay focused'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={reset}
              className="w-12 h-12 rounded-xl bg-[var(--color-bg-elevated)] flex items-center justify-center hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <RotateCcw size={20} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRunning(!isRunning)}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-shadow ${
                isRunning
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30'
                  : 'bg-gradient-to-br from-[#818cf8] to-[#6366f1] shadow-indigo-500/30'
              }`}
            >
              {isRunning ? <Pause size={28} className="text-white" /> : <Play size={28} className="text-white ml-1" />}
            </motion.button>
            <div className="w-12 h-12" />
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Today" value={`${todayHours}h`} subtitle={`${todayFocus?.sessions.length || 0} sessions`} icon={<Brain size={18} className="text-emerald-400" />} />
            <StatCard label="This Week" value={`${(weeklyTotal / 60).toFixed(1)}h`} />
            <StatCard label="Signal:Noise" value={focusScreenRatio} subtitle="Focus ÷ Screen" />
            <StatCard label="Avg/Day" value={`${((weeklyTotal / 7) / 60).toFixed(1)}h`} />
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Weekly Focus Hours</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}h`} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v}h`} />} />
                <Bar dataKey="hours" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
