import { useState, useEffect, useCallback } from 'react';
import type {
  AppData, Habit, HabitEntry, SleepEntry, ScreentimeEntry,
  WorkoutEntry, NutritionEntry, HydrationEntry, MoodEntry,
  BodyMetricsEntry, FocusEntry, FinanceEntry, Goal,
  MonthlyBudget, CompositeWeights, Alert
} from '@/types';

const STORAGE_KEY = 'axis_data';

const defaultWeights: CompositeWeights = {
  mood: 0.25,
  energy: 0.2,
  focusHours: 0.2,
  sleepDuration: 0.2,
  workoutCompleted: 0.15,
};

const defaultData: AppData = {
  habits: [],
  habitEntries: [],
  sleep: [],
  screentime: [],
  workouts: [],
  nutrition: [],
  hydration: [],
  mood: [],
  bodyMetrics: [],
  focus: [],
  finance: [],
  goals: [],
  monthlyBudgets: [],
  compositeWeights: defaultWeights,
  alerts: [],
};

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed };
  } catch {
    return defaultData;
  }
}

function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Simple global state with pub/sub
type Listener = () => void;
let globalData: AppData = loadData();
const listeners = new Set<Listener>();

function notify() {
  saveData(globalData);
  listeners.forEach(l => l());
}

export function useStore() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const data = globalData;

  const update = useCallback((updater: (d: AppData) => AppData) => {
    globalData = updater(globalData);
    notify();
  }, []);

  // Utility ID generator
  const genId = () => crypto.randomUUID();

  // ===================== HABITS =====================
  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt'>) => {
    update(d => ({
      ...d,
      habits: [...d.habits, { ...habit, id: genId(), createdAt: new Date().toISOString() }],
    }));
  }, [update]);

  const deleteHabit = useCallback((id: string) => {
    update(d => ({
      ...d,
      habits: d.habits.filter(h => h.id !== id),
      habitEntries: d.habitEntries.filter(e => e.habitId !== id),
    }));
  }, [update]);

  const toggleHabitEntry = useCallback((habitId: string, date: string) => {
    update(d => {
      const existing = d.habitEntries.find(e => e.habitId === habitId && e.date === date);
      if (existing) {
        return { ...d, habitEntries: d.habitEntries.filter(e => e.id !== existing.id) };
      }
      return {
        ...d,
        habitEntries: [...d.habitEntries, { id: genId(), habitId, date, completed: true }],
      };
    });
  }, [update]);

  // ===================== SLEEP =====================
  const addSleepEntry = useCallback((entry: Omit<SleepEntry, 'id'>) => {
    update(d => {
      const filtered = d.sleep.filter(s => s.date !== entry.date);
      return { ...d, sleep: [...filtered, { ...entry, id: genId() }] };
    });
  }, [update]);

  const deleteSleepEntry = useCallback((id: string) => {
    update(d => ({ ...d, sleep: d.sleep.filter(s => s.id !== id) }));
  }, [update]);

  // ===================== SCREENTIME =====================
  const addScreentimeEntry = useCallback((entry: Omit<ScreentimeEntry, 'id'>) => {
    update(d => {
      const filtered = d.screentime.filter(s => s.date !== entry.date);
      return { ...d, screentime: [...filtered, { ...entry, id: genId() }] };
    });
  }, [update]);

  // ===================== WORKOUTS =====================
  const addWorkoutEntry = useCallback((entry: Omit<WorkoutEntry, 'id'>) => {
    update(d => ({ ...d, workouts: [...d.workouts, { ...entry, id: genId() }] }));
  }, [update]);

  const deleteWorkoutEntry = useCallback((id: string) => {
    update(d => ({ ...d, workouts: d.workouts.filter(w => w.id !== id) }));
  }, [update]);

  // ===================== NUTRITION =====================
  const addNutritionEntry = useCallback((entry: Omit<NutritionEntry, 'id'>) => {
    update(d => {
      const filtered = d.nutrition.filter(n => n.date !== entry.date);
      return { ...d, nutrition: [...filtered, { ...entry, id: genId() }] };
    });
  }, [update]);

  // ===================== HYDRATION =====================
  const addHydrationEntry = useCallback((entry: Omit<HydrationEntry, 'id'>) => {
    update(d => {
      const filtered = d.hydration.filter(h => h.date !== entry.date);
      return { ...d, hydration: [...filtered, { ...entry, id: genId() }] };
    });
  }, [update]);

  const incrementWater = useCallback((date: string) => {
    update(d => {
      const existing = d.hydration.find(h => h.date === date);
      if (existing) {
        return {
          ...d,
          hydration: d.hydration.map(h =>
            h.id === existing.id ? { ...h, glasses: h.glasses + 1 } : h
          ),
        };
      }
      return {
        ...d,
        hydration: [...d.hydration, { id: genId(), date, glasses: 1, goal: 8 }],
      };
    });
  }, [update]);

  const decrementWater = useCallback((date: string) => {
    update(d => {
      const existing = d.hydration.find(h => h.date === date);
      if (existing && existing.glasses > 0) {
        return {
          ...d,
          hydration: d.hydration.map(h =>
            h.id === existing.id ? { ...h, glasses: h.glasses - 1 } : h
          ),
        };
      }
      return d;
    });
  }, [update]);

  // ===================== MOOD =====================
  const addMoodEntry = useCallback((entry: Omit<MoodEntry, 'id'>) => {
    update(d => {
      const filtered = d.mood.filter(m => m.date !== entry.date);
      return { ...d, mood: [...filtered, { ...entry, id: genId() }] };
    });
  }, [update]);

  // ===================== BODY METRICS =====================
  const addBodyMetricsEntry = useCallback((entry: Omit<BodyMetricsEntry, 'id'>) => {
    update(d => {
      const filtered = d.bodyMetrics.filter(b => b.date !== entry.date);
      return { ...d, bodyMetrics: [...filtered, { ...entry, id: genId() }] };
    });
  }, [update]);

  // ===================== FOCUS =====================
  const addFocusEntry = useCallback((entry: Omit<FocusEntry, 'id'>) => {
    update(d => {
      const filtered = d.focus.filter(f => f.date !== entry.date);
      return { ...d, focus: [...filtered, { ...entry, id: genId() }] };
    });
  }, [update]);

  const addFocusSession = useCallback((date: string, session: Omit<FocusEntry['sessions'][0], 'id'>) => {
    update(d => {
      const existing = d.focus.find(f => f.date === date);
      const newSession = { ...session, id: genId() };
      if (existing) {
        const updatedSessions = [...existing.sessions, newSession];
        const totalMinutes = updatedSessions.reduce((s, sess) => s + (sess.completed ? sess.duration : 0), 0);
        return {
          ...d,
          focus: d.focus.map(f =>
            f.id === existing.id ? { ...f, sessions: updatedSessions, totalMinutes } : f
          ),
        };
      }
      return {
        ...d,
        focus: [...d.focus, {
          id: genId(), date,
          totalMinutes: session.completed ? session.duration : 0,
          sessions: [newSession],
        }],
      };
    });
  }, [update]);

  // ===================== FINANCE =====================
  const addFinanceEntry = useCallback((entry: Omit<FinanceEntry, 'id'>) => {
    update(d => ({ ...d, finance: [...d.finance, { ...entry, id: genId() }] }));
  }, [update]);

  const deleteFinanceEntry = useCallback((id: string) => {
    update(d => ({ ...d, finance: d.finance.filter(f => f.id !== id) }));
  }, [update]);

  const setMonthlyBudget = useCallback((budget: Omit<MonthlyBudget, 'id'>) => {
    update(d => {
      const filtered = d.monthlyBudgets.filter(b => b.month !== budget.month);
      return { ...d, monthlyBudgets: [...filtered, { ...budget, id: genId() }] };
    });
  }, [update]);

  // ===================== GOALS =====================
  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    update(d => ({
      ...d,
      goals: [...d.goals, { ...goal, id: genId(), createdAt: new Date().toISOString() }],
    }));
  }, [update]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    update(d => ({
      ...d,
      goals: d.goals.map(g => g.id === id ? { ...g, ...updates } : g),
    }));
  }, [update]);

  const deleteGoal = useCallback((id: string) => {
    update(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) }));
  }, [update]);

  const toggleSubTask = useCallback((goalId: string, subTaskId: string) => {
    update(d => ({
      ...d,
      goals: d.goals.map(g =>
        g.id === goalId
          ? {
              ...g,
              subTasks: g.subTasks.map(st =>
                st.id === subTaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : g
      ),
    }));
  }, [update]);

  // ===================== WEIGHTS =====================
  const setCompositeWeights = useCallback((weights: CompositeWeights) => {
    update(d => ({ ...d, compositeWeights: weights }));
  }, [update]);

  // ===================== ALERTS =====================
  const dismissAlert = useCallback((id: string) => {
    update(d => ({
      ...d,
      alerts: d.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a),
    }));
  }, [update]);

  const setAlerts = useCallback((alerts: Alert[]) => {
    update(d => ({ ...d, alerts }));
  }, [update]);

  // ===================== EXPORT / IMPORT =====================
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(globalData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axis-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importData = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      globalData = { ...defaultData, ...parsed };
      notify();
      return true;
    } catch {
      return false;
    }
  }, []);

  const exportModuleCSV = useCallback((module: keyof AppData) => {
    const moduleData = globalData[module];
    if (!Array.isArray(moduleData) || moduleData.length === 0) return;
    
    const headers = Object.keys(moduleData[0] as Record<string, unknown>);
    const rows = (moduleData as Record<string, unknown>[]).map(item =>
      headers.map(h => {
        const val = item[h];
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val ?? '');
      }).join(',')
    );
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axis-${module}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    data,
    addHabit, deleteHabit, toggleHabitEntry,
    addSleepEntry, deleteSleepEntry,
    addScreentimeEntry,
    addWorkoutEntry, deleteWorkoutEntry,
    addNutritionEntry,
    addHydrationEntry, incrementWater, decrementWater,
    addMoodEntry,
    addBodyMetricsEntry,
    addFocusEntry, addFocusSession,
    addFinanceEntry, deleteFinanceEntry, setMonthlyBudget,
    addGoal, updateGoal, deleteGoal, toggleSubTask,
    setCompositeWeights,
    dismissAlert, setAlerts,
    exportData, importData, exportModuleCSV,
  };
}
