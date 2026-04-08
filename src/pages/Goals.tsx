import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Modal, EmptyState } from '@/components/ui';
import { formatDateFull } from '@/utils/helpers';
import { Flag, Plus, Trash2, CheckCircle2, PauseCircle, CircleDot } from 'lucide-react';
import type { GoalStatus } from '@/types';

const statusConfig: Record<GoalStatus, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Active', color: 'text-[var(--color-accent)]', icon: <CircleDot size={14} /> },
  completed: { label: 'Completed', color: 'text-[var(--color-good)]', icon: <CheckCircle2 size={14} /> },
  paused: { label: 'Paused', color: 'text-[var(--color-warning)]', icon: <PauseCircle size={14} /> },
};

export default function GoalsPage() {
  const { data, addGoal, updateGoal, deleteGoal, toggleSubTask } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<GoalStatus | 'all'>('all');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formSubTasks, setFormSubTasks] = useState<string[]>(['']);
  const [formLinkedHabits, setFormLinkedHabits] = useState<string[]>([]);

  const handleAdd = () => {
    if (!formTitle.trim()) return;
    const subTasks = formSubTasks.filter(st => st.trim()).map(text => ({
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
    }));
    addGoal({
      title: formTitle.trim(),
      description: formDesc,
      deadline: formDeadline,
      status: 'active',
      linkedHabitIds: formLinkedHabits,
      subTasks,
    });
    setShowAdd(false);
    setFormTitle('');
    setFormDesc('');
    setFormDeadline('');
    setFormSubTasks(['']);
    setFormLinkedHabits([]);
  };

  const filteredGoals = filter === 'all' ? data.goals : data.goals.filter(g => g.status === filter);

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle="Set goals, break them into tasks, track progress"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Add Goal</Button>}
      />

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'active', 'completed', 'paused'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === s
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? data.goals.length : data.goals.filter(g => g.status === s).length})
          </button>
        ))}
      </div>

      {filteredGoals.length === 0 ? (
        <EmptyState message="No goals yet. Set your first goal to get started." icon={<Flag size={48} />} />
      ) : (
        <div className="space-y-4">
          {filteredGoals.map(goal => {
            const completed = goal.subTasks.filter(st => st.completed).length;
            const total = goal.subTasks.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const config = statusConfig[goal.status];

            return (
              <motion.div
                key={goal.id}
                layout
                className="glass-card glass-card-hover p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{goal.title}</h3>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.color} bg-current/10`}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                    {goal.description && <p className="text-sm text-[var(--color-text-secondary)]">{goal.description}</p>}
                    {goal.deadline && (
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Due: {formatDateFull(goal.deadline)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={goal.status}
                      onChange={e => updateGoal(goal.id, { status: e.target.value as GoalStatus })}
                      className="text-xs py-1 px-2 bg-[var(--color-bg-elevated)]"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                    </select>
                    <button onClick={() => deleteGoal(goal.id)} className="text-[var(--color-text-tertiary)] hover:text-red-400 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                {total > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--color-text-tertiary)]">{completed}/{total} tasks</span>
                      <span className="text-xs font-medium text-[var(--color-accent)]">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--color-bg-hover)]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#818cf8] to-[#6366f1]"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}

                {/* Sub-tasks */}
                {goal.subTasks.length > 0 && (
                  <div className="space-y-1">
                    {goal.subTasks.map(st => (
                      <button
                        key={st.id}
                        onClick={() => toggleSubTask(goal.id, st.id)}
                        className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          st.completed
                            ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
                            : 'border-[var(--color-border)]'
                        }`}>
                          {st.completed && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className={`text-sm ${st.completed ? 'line-through text-[var(--color-text-tertiary)]' : ''}`}>
                          {st.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Linked habits */}
                {goal.linkedHabitIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                    {goal.linkedHabitIds.map(hid => {
                      const habit = data.habits.find(h => h.id === hid);
                      return habit ? (
                        <span key={hid} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-muted)] text-[var(--color-accent)]">
                          {habit.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Goal">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Title</label>
            <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full" placeholder="e.g. Run a marathon" autoFocus />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Description</label>
            <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full h-16 resize-none" placeholder="Optional description" />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Deadline</label>
            <input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Sub-tasks</label>
            <div className="space-y-2">
              {formSubTasks.map((st, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={st}
                    onChange={e => {
                      const updated = [...formSubTasks];
                      updated[i] = e.target.value;
                      setFormSubTasks(updated);
                    }}
                    className="flex-1"
                    placeholder={`Task ${i + 1}`}
                  />
                  {formSubTasks.length > 1 && (
                    <button onClick={() => setFormSubTasks(formSubTasks.filter((_, j) => j !== i))} className="text-[var(--color-text-tertiary)] hover:text-red-400">✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => setFormSubTasks([...formSubTasks, ''])} className="text-xs text-[var(--color-accent)] hover:underline">+ Add sub-task</button>
            </div>
          </div>
          {data.habits.length > 0 && (
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Link to Habits</label>
              <div className="flex flex-wrap gap-2">
                {data.habits.map(h => (
                  <button
                    key={h.id}
                    onClick={() => {
                      setFormLinkedHabits(prev =>
                        prev.includes(h.id) ? prev.filter(id => id !== h.id) : [...prev, h.id]
                      );
                    }}
                    className={`text-xs px-2 py-1 rounded-lg transition-all ${
                      formLinkedHabits.includes(h.id)
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button onClick={handleAdd} className="w-full">Create Goal</Button>
        </div>
      </Modal>
    </div>
  );
}
