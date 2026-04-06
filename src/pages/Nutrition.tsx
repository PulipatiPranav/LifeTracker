import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { PageHeader, Button, Modal, StatCard, Tabs, ChartTooltip } from '@/components/ui';
import { today, mean, last7Days, last30Days, formatDate } from '@/utils/helpers';
import { UtensilsCrossed, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const MACRO_COLORS = { protein: '#818cf8', carbs: '#34d399', fat: '#fbbf24' };

export default function NutritionPage() {
  const { data, addNutritionEntry } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [range, setRange] = useState('7d');
  const [formDate, setFormDate] = useState(today());
  const [formCalories, setFormCalories] = useState(2000);
  const [formProtein, setFormProtein] = useState(150);
  const [formCarbs, setFormCarbs] = useState(200);
  const [formFat, setFormFat] = useState(70);

  const handleAdd = () => {
    addNutritionEntry({ date: formDate, calories: formCalories, protein: formProtein, carbs: formCarbs, fat: formFat });
    setShowAdd(false);
  };

  const days = range === '7d' ? last7Days() : last30Days();

  const chartData = useMemo(() => {
    return days.map(date => {
      const entry = data.nutrition.find(n => n.date === date);
      return {
        date: formatDate(date),
        calories: entry?.calories || null,
        protein: entry?.protein || null,
        carbs: entry?.carbs || null,
        fat: entry?.fat || null,
      };
    });
  }, [data.nutrition, range]);

  const todayData = data.nutrition.find(n => n.date === today());
  const avgCals = useMemo(() => {
    const vals = data.nutrition.filter(n => days.includes(n.date)).map(n => n.calories);
    return vals.length ? mean(vals) : 0;
  }, [data.nutrition, days]);

  // Macro donut for today
  const macroData = todayData ? [
    { name: 'Protein', value: todayData.protein * 4, color: MACRO_COLORS.protein },
    { name: 'Carbs', value: todayData.carbs * 4, color: MACRO_COLORS.carbs },
    { name: 'Fat', value: todayData.fat * 9, color: MACRO_COLORS.fat },
  ] : [];

  // Auto-suggested targets based on workouts this week
  const weekWorkouts = data.workouts.filter(w => last7Days().includes(w.date));
  const suggestedProtein = weekWorkouts.length >= 4 ? 180 : weekWorkouts.length >= 2 ? 150 : 120;
  const suggestedCals = weekWorkouts.length >= 4 ? 2500 : weekWorkouts.length >= 2 ? 2200 : 2000;

  return (
    <div>
      <PageHeader
        title="Nutrition"
        subtitle="Track calories and macros"
        action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Log Nutrition</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Today's Calories" value={todayData?.calories.toLocaleString() || '—'} icon={<UtensilsCrossed size={20} className="text-yellow-400" />} />
        <StatCard label="Avg Calories" value={Math.round(avgCals).toLocaleString()} subtitle={`last ${range}`} />
        <StatCard label="Suggested Cal" value={suggestedCals.toLocaleString()} subtitle={`${weekWorkouts.length} workouts/wk`} />
        <StatCard label="Suggested Protein" value={`${suggestedProtein}g`} subtitle="based on activity" />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Macro Ring */}
        <div className="glass-card p-5 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Today's Macros</h3>
          {macroData.length > 0 ? (
            <>
              <PieChart width={160} height={160}>
                <Pie
                  data={macroData}
                  cx={80}
                  cy={80}
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {macroData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="flex gap-4 mt-2">
                {macroData.map(m => (
                  <div key={m.name} className="text-center">
                    <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: m.color }} />
                    <p className="text-xs text-[var(--color-text-tertiary)]">{m.name}</p>
                    <p className="text-sm font-medium">{m.name === 'Fat' ? Math.round(m.value / 9) : Math.round(m.value / 4)}g</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-tertiary)] py-8">No data today</p>
          )}
        </div>

        {/* Calorie Trend */}
        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">Calorie Trend</h3>
            <Tabs tabs={['7d', '30d']} active={range} onChange={setRange} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="calories" stroke="#fbbf24" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Macro trends */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Macro Trends</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}g`} />
            <Tooltip content={<ChartTooltip formatter={(v: number) => `${v}g`} />} />
            <Line type="monotone" dataKey="protein" stroke={MACRO_COLORS.protein} strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="carbs" stroke={MACRO_COLORS.carbs} strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="fat" stroke={MACRO_COLORS.fat} strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: MACRO_COLORS.protein }} /> Protein</span>
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: MACRO_COLORS.carbs }} /> Carbs</span>
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: MACRO_COLORS.fat }} /> Fat</span>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Nutrition">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Date</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Calories</label>
            <input type="number" value={formCalories} onChange={e => setFormCalories(parseInt(e.target.value) || 0)} className="w-full" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Protein (g)</label>
              <input type="number" value={formProtein} onChange={e => setFormProtein(parseInt(e.target.value) || 0)} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Carbs (g)</label>
              <input type="number" value={formCarbs} onChange={e => setFormCarbs(parseInt(e.target.value) || 0)} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Fat (g)</label>
              <input type="number" value={formFat} onChange={e => setFormFat(parseInt(e.target.value) || 0)} className="w-full" />
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full">Save</Button>
        </div>
      </Modal>
    </div>
  );
}
