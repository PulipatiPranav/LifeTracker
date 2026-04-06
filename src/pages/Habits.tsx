import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Modal, StatCard, EmptyState } from '@/components/ui';
import { today, colorScale, getStreak, formatDate } from '@/utils/helpers';
import { Target, Plus, Flame, Trash2, Link } from 'lucide-react';
import { format, subDays, startOfWeek, eachDayOfInterval, subWeeks, getDay } from 'date-fns';
import type { HabitType, HabitCategory } from '@/types';

const categories: HabitCategory[] = ['Health', 'Focus', 'Finance', 'Social', 'Mindset'];

export default function HabitsPage() {
  const { data, addHabit, deleteHabit, toggleHabitEntry } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<HabitType>('good');
  const [newCategory, setNewCategory] = useState<HabitCategory>('Health');
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('All');

  const todayStr = today();

  const filteredHabits = useMemo(() => {
    if (filterCat === 'All') return data.habits;
    return data.habits.filter(h => h.category === filterCat);
  }, [data.habits, filterCat]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addHabit({ name: newName.trim(), type: newType, category: newCategory, linkedHabitIds: [] });
    setNewName('');
    setShowAdd(false);
  };

  // Generate heatmap data (last 52 weeks)
  const heatmapWeeks = useMemo(() => {
    const weeks: string[][] = [];
    const endDate = new Date();
    const startDate = subWeeks(startOfWeek(endDate, { weekStartsOn: 0 }), 51);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    let currentWeek: string[] = [];
    const firstDayOfWeek = getDay(days[0]);
    // Pad the first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push('');
    }
    
    for (const day of days) {
      currentWeek.push(format(day, 'yyyy-MM-dd'));
      if (getDay(day) === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    return weeks;
  }, []);

  return (
    <div>
      <PageHeader
        title="Habits"
        subtitle="Build good habits, break bad ones"
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Habit
          </Button>
        }
      />

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterCat === cat
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredHabits.length === 0 ? (
        <EmptyState message="No habits yet. Add your first habit to start tracking." icon={<Target size={48} />} />
      ) : (
        <div className="space-y-4">
          {filteredHabits.map(habit => {
            const entries = data.habitEntries.filter(e => e.habitId === habit.id && e.completed);
            const entryDates = new Set(entries.map(e => e.date));
            const streak = getStreak([...entryDates]);
            const todayDone = entryDates.has(todayStr);
            const isSelected = selectedHabit === habit.id;

            // Count per day for heatmap intensity
            const maxCount = 1; // binary

            return (
              <motion.div
                key={habit.id}
                layout
                className="glass-card overflow-hidden"
              >
                {/* Habit header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleHabitEntry(habit.id, todayStr)}
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                        todayDone
                          ? habit.type === 'good'
                            ? 'bg-[var(--color-good)] border-[var(--color-good)] text-white'
                            : 'bg-[var(--color-bad)] border-[var(--color-bad)] text-white'
                          : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                      }`}
                    >
                      {todayDone && '✓'}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{habit.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          habit.type === 'good' ? 'bg-[var(--color-good-muted)] text-[var(--color-good)]' : 'bg-[var(--color-bad-muted)] text-[var(--color-bad)]'
                        }`}>
                          {habit.type.toUpperCase()}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]">
                          {habit.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {streak > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame size={16} className="text-orange-400 flame-pulse" />
                        <span className="text-sm font-bold text-orange-400">{streak}d</span>
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedHabit(isSelected ? null : habit.id)}
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text)] p-1"
                    >
                      {isSelected ? '▲' : '▼'}
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-[var(--color-text-tertiary)] hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Heatmap */}
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 overflow-hidden"
                  >
                    <div className="flex gap-[3px] overflow-x-auto pb-2">
                      {heatmapWeeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-[3px]">
                          {week.map((day, di) => {
                            if (!day) return <div key={di} className="w-[11px] h-[11px]" />;
                            const done = entryDates.has(day);
                            const bg = done
                              ? colorScale(1, maxCount, habit.type === 'good' ? 'green' : 'red')
                              : 'rgba(39, 39, 42, 0.5)';
                            return (
                              <div
                                key={di}
                                title={`${day}: ${done ? 'Done' : 'Missed'}`}
                                onClick={() => toggleHabitEntry(habit.id, day)}
                                className="w-[11px] h-[11px] rounded-[2px] cursor-pointer hover:ring-1 hover:ring-white/30 transition-all"
                                style={{ backgroundColor: bg }}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-tertiary)]">
                      <span>Total: {entryDates.size} days</span>
                      <span>Streak: {streak} days</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Habit">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Name</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Exercise 30 min"
              className="w-full"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNewType('good')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  newType === 'good' ? 'bg-[var(--color-good)] text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'
                }`}
              >
                Good ✓
              </button>
              <button
                onClick={() => setNewType('bad')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  newType === 'bad' ? 'bg-[var(--color-bad)] text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'
                }`}
              >
                Bad ✗
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Category</label>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value as HabitCategory)} className="w-full">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Button onClick={handleAdd} className="w-full">Add Habit</Button>
        </div>
      </Modal>
    </div>
  );
}
