import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { today, moodEmojis, energyEmojis, getStreak } from '@/utils/helpers';
import { computeAlerts } from '@/utils/patterns';
import { StatCard, ProgressRing } from '@/components/ui';
import {
  Moon, Droplets, Heart, Brain, Dumbbell, UtensilsCrossed,
  Wallet, Target, Flame, AlertTriangle, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { data, dismissAlert, setAlerts } = useStore();
  const navigate = useNavigate();
  const todayStr = today();

  // Compute alerts
  useMemo(() => {
    const alerts = computeAlerts(data);
    const existingDismissed = data.alerts.filter(a => a.dismissed).map(a => a.id);
    const merged = alerts.map(a => ({
      ...a,
      dismissed: existingDismissed.includes(a.id),
    }));
    if (JSON.stringify(merged) !== JSON.stringify(data.alerts)) {
      setAlerts(merged);
    }
  }, [data.sleep.length, data.mood.length, data.nutrition.length, data.hydration.length, data.screentime.length]);

  const activeAlerts = data.alerts.filter(a => !a.dismissed);

  // Today's data
  const todaySleep = data.sleep.find(s => s.date === todayStr);
  const todayMood = data.mood.find(m => m.date === todayStr);
  const todayHydration = data.hydration.find(h => h.date === todayStr);
  const todayNutrition = data.nutrition.find(n => n.date === todayStr);
  const todayScreen = data.screentime.find(s => s.date === todayStr);
  const todayFocus = data.focus.find(f => f.date === todayStr);
  const todayWorkout = data.workouts.find(w => w.date === todayStr);
  const todayFinance = data.finance.filter(f => f.date === todayStr);
  const todaySpend = todayFinance.reduce((s, f) => s + f.amount, 0);

  // Habits
  const todayHabitEntries = data.habitEntries.filter(e => e.date === todayStr);
  const habitsCompleted = todayHabitEntries.length;
  const habitsTotal = data.habits.length;

  // Active goals
  const activeGoals = data.goals.filter(g => g.status === 'active');

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-2">
          {activeAlerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
              <AlertTriangle size={16} className="text-[var(--color-warning)] shrink-0" />
              <p className="text-sm text-[var(--color-warning)] flex-1">{alert.message}</p>
              <button onClick={() => dismissAlert(alert.id)} className="p-1 hover:bg-white/5 rounded">
                <X size={14} className="text-[var(--color-text-tertiary)]" />
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* Today at a glance */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <motion.div variants={item} onClick={() => navigate('/habits')} className="cursor-pointer">
          <StatCard
            label="Habits"
            value={`${habitsCompleted}/${habitsTotal}`}
            subtitle={habitsTotal > 0 ? `${Math.round((habitsCompleted / habitsTotal) * 100)}% done` : 'No habits yet'}
            icon={<Target size={20} className="text-[var(--color-accent)]" />}
          />
        </motion.div>

        <motion.div variants={item} onClick={() => navigate('/sleep')} className="cursor-pointer">
          <StatCard
            label="Sleep"
            value={todaySleep ? `${todaySleep.duration.toFixed(1)}h` : '—'}
            subtitle={todaySleep ? `${todaySleep.bedtime} → ${todaySleep.wakeTime}` : 'Not logged'}
            icon={<Moon size={20} className="text-indigo-400" />}
          />
        </motion.div>

        <motion.div variants={item} onClick={() => navigate('/mood')} className="cursor-pointer">
          <StatCard
            label="Mood"
            value={todayMood ? moodEmojis[todayMood.mood] : '—'}
            subtitle={todayMood ? `Energy: ${energyEmojis[todayMood.energy]}` : 'Not logged'}
            icon={<Heart size={20} className="text-pink-400" />}
          />
        </motion.div>

        <motion.div variants={item} onClick={() => navigate('/hydration')} className="cursor-pointer">
          <StatCard
            label="Hydration"
            value={todayHydration ? `${todayHydration.glasses}/${todayHydration.goal}` : '0/8'}
            subtitle="glasses"
            icon={<Droplets size={20} className="text-cyan-400" />}
          />
        </motion.div>

        <motion.div variants={item} onClick={() => navigate('/focus')} className="cursor-pointer">
          <StatCard
            label="Focus"
            value={todayFocus ? `${(todayFocus.totalMinutes / 60).toFixed(1)}h` : '0h'}
            subtitle={todayFocus ? `${todayFocus.sessions.length} sessions` : 'No sessions'}
            icon={<Brain size={20} className="text-emerald-400" />}
          />
        </motion.div>

        <motion.div variants={item} onClick={() => navigate('/workouts')} className="cursor-pointer">
          <StatCard
            label="Workout"
            value={todayWorkout ? '✓' : '—'}
            subtitle={todayWorkout ? `${todayWorkout.exercises.length} exercises` : 'Not logged'}
            icon={<Dumbbell size={20} className="text-orange-400" />}
          />
        </motion.div>

        <motion.div variants={item} onClick={() => navigate('/nutrition')} className="cursor-pointer">
          <StatCard
            label="Calories"
            value={todayNutrition ? todayNutrition.calories.toLocaleString() : '—'}
            subtitle={todayNutrition ? `P${todayNutrition.protein}g C${todayNutrition.carbs}g F${todayNutrition.fat}g` : 'Not logged'}
            icon={<UtensilsCrossed size={20} className="text-yellow-400" />}
          />
        </motion.div>

        <motion.div variants={item} onClick={() => navigate('/finance')} className="cursor-pointer">
          <StatCard
            label="Spending"
            value={todaySpend > 0 ? `$${todaySpend.toFixed(0)}` : '$0'}
            subtitle={`${todayFinance.length} transactions`}
            icon={<Wallet size={20} className="text-green-400" />}
          />
        </motion.div>
      </motion.div>

      {/* Quick sections */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {/* Habit streaks */}
        {data.habits.length > 0 && (
          <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Active Streaks</h3>
            <div className="space-y-3">
              {data.habits.map(habit => {
                const entries = data.habitEntries
                  .filter(e => e.habitId === habit.id && e.completed)
                  .map(e => e.date);
                const streak = getStreak(entries);
                if (streak === 0) return null;
                return (
                  <div key={habit.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${habit.type === 'good' ? 'bg-[var(--color-good)]' : 'bg-[var(--color-bad)]'}`} />
                      <span className="text-sm">{habit.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame size={14} className="text-orange-400 flame-pulse" />
                      <span className="text-sm font-bold text-orange-400">{streak}d</span>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
              {data.habits.every(habit => {
                const entries = data.habitEntries.filter(e => e.habitId === habit.id && e.completed).map(e => e.date);
                return getStreak(entries) === 0;
              }) && <p className="text-sm text-[var(--color-text-tertiary)]">No active streaks</p>}
            </div>
          </motion.div>
        )}

        {/* Active goals */}
        {activeGoals.length > 0 && (
          <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Active Goals</h3>
            <div className="space-y-3">
              {activeGoals.slice(0, 5).map(goal => {
                const completed = goal.subTasks.filter(st => st.completed).length;
                const total = goal.subTasks.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={goal.id} onClick={() => navigate('/goals')} className="cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{goal.title}</span>
                      <span className="text-xs text-[var(--color-text-tertiary)]">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--color-bg-hover)]">
                      <motion.div
                        className="h-full rounded-full bg-[var(--color-accent)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Screentime today */}
        {todayScreen && (
          <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Screen Time Today</h3>
            <div className="text-center mb-3">
              <span className="text-3xl font-bold">{Math.round(todayScreen.total / 60)}h {todayScreen.total % 60}m</span>
            </div>
            <div className="space-y-2">
              {Object.entries(todayScreen.categories).map(([cat, mins]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-secondary)]">{cat}</span>
                  <span className="text-xs font-medium">{mins}m</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Hydration ring */}
        <motion.div variants={item} initial="hidden" animate="show" className="glass-card p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">Hydration</h3>
          <ProgressRing
            value={todayHydration?.glasses ?? 0}
            max={todayHydration?.goal ?? 8}
            size={140}
            strokeWidth={10}
            color="#22d3ee"
          >
            <div className="text-center">
              <p className="text-2xl font-bold">{todayHydration?.glasses ?? 0}</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">of {todayHydration?.goal ?? 8}</p>
            </div>
          </ProgressRing>
        </motion.div>
      </div>
    </div>
  );
}
