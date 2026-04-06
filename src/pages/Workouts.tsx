import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Modal, StatCard, Tabs, EmptyState } from '@/components/ui';
import { today, formatDate, getExerciseMuscles } from '@/utils/helpers';
import { Dumbbell, Plus, Trash2 } from 'lucide-react';
import type { Exercise, MuscleGroup } from '@/types';
import { subDays, format } from 'date-fns';

const allMuscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quads', 'hamstrings', 'glutes', 'calves', 'traps', 'lats', 'obliques',
];

// SVG body diagram component
function BodyDiagram({ muscleData, view }: { muscleData: Record<string, number>; view: 'anterior' | 'posterior' }) {
  const maxVolume = Math.max(...Object.values(muscleData), 1);

  const getColor = (muscle: string) => {
    const vol = muscleData[muscle] || 0;
    if (vol === 0) return '#27272a';
    const intensity = Math.min(vol / maxVolume, 1);
    const r = Math.round(99 + intensity * 30);
    const g = Math.round(102 + intensity * 100);
    const b = Math.round(241);
    return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.7})`;
  };

  // Simplified body map with regions
  const anteriorMuscles: { muscle: string; x: number; y: number; w: number; h: number; rx: number }[] = [
    { muscle: 'shoulders', x: 25, y: 38, w: 18, h: 14, rx: 6 },
    { muscle: 'shoulders', x: 77, y: 38, w: 18, h: 14, rx: 6 },
    { muscle: 'chest', x: 38, y: 42, w: 44, h: 20, rx: 8 },
    { muscle: 'biceps', x: 20, y: 55, w: 14, h: 24, rx: 5 },
    { muscle: 'biceps', x: 86, y: 55, w: 14, h: 24, rx: 5 },
    { muscle: 'forearms', x: 16, y: 80, w: 12, h: 22, rx: 4 },
    { muscle: 'forearms', x: 92, y: 80, w: 12, h: 22, rx: 4 },
    { muscle: 'core', x: 42, y: 64, w: 36, h: 26, rx: 6 },
    { muscle: 'obliques', x: 36, y: 66, w: 8, h: 20, rx: 3 },
    { muscle: 'obliques', x: 76, y: 66, w: 8, h: 20, rx: 3 },
    { muscle: 'quads', x: 36, y: 95, w: 18, h: 36, rx: 6 },
    { muscle: 'quads', x: 66, y: 95, w: 18, h: 36, rx: 6 },
    { muscle: 'calves', x: 38, y: 136, w: 14, h: 24, rx: 5 },
    { muscle: 'calves', x: 68, y: 136, w: 14, h: 24, rx: 5 },
  ];

  const posteriorMuscles: { muscle: string; x: number; y: number; w: number; h: number; rx: number }[] = [
    { muscle: 'traps', x: 40, y: 28, w: 40, h: 16, rx: 6 },
    { muscle: 'shoulders', x: 25, y: 38, w: 18, h: 14, rx: 6 },
    { muscle: 'shoulders', x: 77, y: 38, w: 18, h: 14, rx: 6 },
    { muscle: 'lats', x: 34, y: 46, w: 52, h: 22, rx: 8 },
    { muscle: 'back', x: 42, y: 42, w: 36, h: 28, rx: 6 },
    { muscle: 'triceps', x: 20, y: 55, w: 14, h: 24, rx: 5 },
    { muscle: 'triceps', x: 86, y: 55, w: 14, h: 24, rx: 5 },
    { muscle: 'glutes', x: 38, y: 88, w: 44, h: 18, rx: 8 },
    { muscle: 'hamstrings', x: 36, y: 108, w: 18, h: 30, rx: 6 },
    { muscle: 'hamstrings', x: 66, y: 108, w: 18, h: 30, rx: 6 },
    { muscle: 'calves', x: 38, y: 142, w: 14, h: 22, rx: 5 },
    { muscle: 'calves', x: 68, y: 142, w: 14, h: 22, rx: 5 },
  ];

  const muscles = view === 'anterior' ? anteriorMuscles : posteriorMuscles;

  return (
    <svg viewBox="0 0 120 170" className="w-full max-w-[200px]">
      {/* Body outline */}
      <ellipse cx="60" cy="16" rx="14" ry="16" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" />
      <rect x="50" y="30" width="20" height="6" rx="3" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" />
      <ellipse cx="60" cy="70" rx="28" ry="40" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" />
      <rect x="36" y="92" width="20" height="68" rx="8" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" />
      <rect x="64" y="92" width="20" height="68" rx="8" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" />
      <rect x="18" y="48" width="16" height="56" rx="6" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" />
      <rect x="86" y="48" width="16" height="56" rx="6" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" />
      
      {/* Muscle groups */}
      {muscles.map((m, i) => (
        <rect
          key={i}
          x={m.x}
          y={m.y}
          width={m.w}
          height={m.h}
          rx={m.rx}
          fill={getColor(m.muscle)}
          className="transition-colors duration-300"
        />
      ))}
    </svg>
  );
}

export default function WorkoutsPage() {
  const { data, addWorkoutEntry, deleteWorkoutEntry } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [bodyView, setBodyView] = useState<'anterior' | 'posterior'>('anterior');
  const [timeFilter, setTimeFilter] = useState('week');
  const [formDate, setFormDate] = useState(today());
  const [formDuration, setFormDuration] = useState(60);
  const [formNotes, setFormNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState(10);
  const [exWeight, setExWeight] = useState(0);

  const addExercise = () => {
    if (!exName.trim()) return;
    const muscleGroups = getExerciseMuscles(exName) as MuscleGroup[];
    setExercises([...exercises, { name: exName, sets: exSets, reps: exReps, weight: exWeight, muscleGroups }]);
    setExName('');
    setExSets(3);
    setExReps(10);
    setExWeight(0);
  };

  const handleAdd = () => {
    if (exercises.length === 0) return;
    addWorkoutEntry({ date: formDate, exercises, duration: formDuration, notes: formNotes });
    setShowAdd(false);
    setExercises([]);
    setFormNotes('');
  };

  // Filter workouts by time
  const filteredWorkouts = useMemo(() => {
    const now = new Date();
    return data.workouts.filter(w => {
      if (timeFilter === 'week') return w.date >= format(subDays(now, 7), 'yyyy-MM-dd');
      if (timeFilter === 'month') return w.date >= format(subDays(now, 30), 'yyyy-MM-dd');
      return true;
    });
  }, [data.workouts, timeFilter]);

  // Muscle volume map
  const muscleData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredWorkouts.forEach(w => {
      w.exercises.forEach(ex => {
        const volume = ex.sets * ex.reps * (ex.weight || 1);
        ex.muscleGroups.forEach(mg => {
          map[mg] = (map[mg] || 0) + volume;
        });
      });
    });
    return map;
  }, [filteredWorkouts]);

  return (
    <div>
      <PageHeader
        title="Workouts"
        subtitle="Track your training and muscle coverage"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Log Workout</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Workouts" value={filteredWorkouts.length} subtitle={timeFilter} icon={<Dumbbell size={20} className="text-orange-400" />} />
        <StatCard label="Total Volume" value={`${(Object.values(muscleData).reduce((s, v) => s + v, 0) / 1000).toFixed(0)}k`} subtitle="reps × weight" />
        <StatCard label="Muscles Hit" value={Object.keys(muscleData).length} subtitle={`of ${allMuscleGroups.length}`} />
        <StatCard label="Avg Duration" value={filteredWorkouts.length ? `${Math.round(filteredWorkouts.reduce((s, w) => s + w.duration, 0) / filteredWorkouts.length)}m` : '—'} />
      </div>

      {/* Muscle Map */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">Muscle Map</h3>
          <div className="flex gap-2">
            <Tabs tabs={['week', 'month', 'all']} active={timeFilter} onChange={setTimeFilter} />
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex gap-6">
            <div className="text-center">
              <button onClick={() => setBodyView('anterior')} className={`text-xs mb-2 ${bodyView === 'anterior' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'}`}>Front</button>
              <BodyDiagram muscleData={muscleData} view="anterior" />
            </div>
            <div className="text-center">
              <button onClick={() => setBodyView('posterior')} className={`text-xs mb-2 ${bodyView === 'posterior' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'}`}>Back</button>
              <BodyDiagram muscleData={muscleData} view="posterior" />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2">
            {allMuscleGroups.map(mg => {
              const vol = muscleData[mg] || 0;
              const maxVol = Math.max(...Object.values(muscleData), 1);
              const pct = Math.round((vol / maxVol) * 100);
              return (
                <div key={mg} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-secondary)] w-20 capitalize">{mg.replace('_', ' ')}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-hover)]">
                    <motion.div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-text-tertiary)] w-8 text-right">{vol > 0 ? (vol / 1000).toFixed(0) + 'k' : '—'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent workouts */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Recent Workouts</h3>
        {filteredWorkouts.length === 0 ? (
          <EmptyState message="No workouts logged yet" icon={<Dumbbell size={48} />} />
        ) : (
          <div className="space-y-3">
            {filteredWorkouts.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(w => (
              <div key={w.id} className="p-3 rounded-xl bg-[var(--color-bg-elevated)] group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatDate(w.date)}</span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">{w.duration}m</span>
                  </div>
                  <button onClick={() => deleteWorkoutEntry(w.id)} className="opacity-0 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {w.exercises.map((ex, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-md bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]">
                      {ex.name} {ex.sets}×{ex.reps}{ex.weight > 0 ? ` @${ex.weight}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Workout Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Workout">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Date</label>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Duration (min)</label>
              <input type="number" value={formDuration} onChange={e => setFormDuration(parseInt(e.target.value) || 0)} className="w-full" />
            </div>
          </div>

          <div className="border border-[var(--color-border)] rounded-xl p-3 space-y-3">
            <h4 className="text-sm font-medium">Add Exercise</h4>
            <input placeholder="Exercise name (e.g. bench press)" value={exName} onChange={e => setExName(e.target.value)} className="w-full" onKeyDown={e => e.key === 'Enter' && addExercise()} />
            {exName && getExerciseMuscles(exName).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {getExerciseMuscles(exName).map(m => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)] capitalize">{m}</span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)]">Sets</label>
                <input type="number" value={exSets} onChange={e => setExSets(parseInt(e.target.value) || 0)} className="w-full" />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)]">Reps</label>
                <input type="number" value={exReps} onChange={e => setExReps(parseInt(e.target.value) || 0)} className="w-full" />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-tertiary)]">Weight</label>
                <input type="number" value={exWeight} onChange={e => setExWeight(parseInt(e.target.value) || 0)} className="w-full" />
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={addExercise}>+ Add Exercise</Button>
          </div>

          {exercises.length > 0 && (
            <div className="space-y-1">
              {exercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[var(--color-bg-elevated)]">
                  <span className="text-sm">{ex.name} — {ex.sets}×{ex.reps}{ex.weight > 0 ? ` @${ex.weight}` : ''}</span>
                  <button onClick={() => setExercises(exercises.filter((_, j) => j !== i))} className="text-[var(--color-text-tertiary)] hover:text-red-400">✕</button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Notes</label>
            <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} className="w-full h-16 resize-none" placeholder="Optional notes..." />
          </div>

          <Button onClick={handleAdd} className="w-full" disabled={exercises.length === 0}>Save Workout</Button>
        </div>
      </Modal>
    </div>
  );
}
