import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, differenceInDays, isValid } from 'date-fns';

export const today = () => format(new Date(), 'yyyy-MM-dd');
export const formatDate = (d: string) => {
  const parsed = parseISO(d);
  return isValid(parsed) ? format(parsed, 'MMM d') : d;
};
export const formatDateFull = (d: string) => {
  const parsed = parseISO(d);
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : d;
};

export const last7Days = () => Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));
export const last30Days = () => Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'));
export const last90Days = () => Array.from({ length: 90 }, (_, i) => format(subDays(new Date(), 89 - i), 'yyyy-MM-dd'));
export const lastNDays = (n: number) => Array.from({ length: n }, (_, i) => format(subDays(new Date(), n - 1 - i), 'yyyy-MM-dd'));

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
};

export const daysBetween = (a: string, b: string) => {
  try {
    return Math.abs(differenceInDays(parseISO(a), parseISO(b)));
  } catch { return 0; }
};

export const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
export const median = (arr: number[]) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
export const stdDev = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1));
};

export const getStreak = (dates: string[]): number => {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  let streak = 0;
  const todayStr = today();
  
  // Check if today or yesterday is in the list
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0;
  
  for (let i = 0; i < sorted.length; i++) {
    const expected = format(subDays(new Date(), i + (sorted[0] === yesterdayStr ? 1 : 0)), 'yyyy-MM-dd');
    if (sorted[i] === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

export const moodEmojis = ['', '😞', '😐', '🙂', '😊', '🤩'];
export const energyEmojis = ['', '🪫', '😴', '⚡', '🔥', '💥'];

export const colorScale = (value: number, max: number, baseColor: string): string => {
  const intensity = max > 0 ? clamp(value / max, 0, 1) : 0;
  if (baseColor === 'green') {
    if (intensity === 0) return 'rgba(39, 39, 42, 0.5)';
    if (intensity < 0.25) return 'rgba(52, 211, 153, 0.2)';
    if (intensity < 0.5) return 'rgba(52, 211, 153, 0.4)';
    if (intensity < 0.75) return 'rgba(52, 211, 153, 0.65)';
    return 'rgba(52, 211, 153, 0.9)';
  }
  if (intensity === 0) return 'rgba(39, 39, 42, 0.5)';
  if (intensity < 0.25) return 'rgba(248, 113, 113, 0.2)';
  if (intensity < 0.5) return 'rgba(248, 113, 113, 0.4)';
  if (intensity < 0.75) return 'rgba(248, 113, 113, 0.65)';
  return 'rgba(248, 113, 113, 0.9)';
};

export const exerciseMuscleMap: Record<string, string[]> = {
  // Chest
  'bench press': ['chest', 'triceps', 'shoulders'],
  'incline bench press': ['chest', 'triceps', 'shoulders'],
  'decline bench press': ['chest', 'triceps'],
  'dumbbell press': ['chest', 'triceps', 'shoulders'],
  'dumbbell fly': ['chest'],
  'cable fly': ['chest'],
  'push up': ['chest', 'triceps', 'core'],
  'chest dip': ['chest', 'triceps'],
  'pec deck': ['chest'],
  // Back
  'deadlift': ['back', 'hamstrings', 'glutes', 'core', 'traps', 'forearms'],
  'barbell row': ['back', 'biceps', 'lats'],
  'dumbbell row': ['back', 'biceps', 'lats'],
  'pull up': ['back', 'biceps', 'lats', 'forearms'],
  'chin up': ['back', 'biceps', 'lats'],
  'lat pulldown': ['lats', 'biceps', 'back'],
  'seated row': ['back', 'biceps', 'lats'],
  'cable row': ['back', 'biceps'],
  't-bar row': ['back', 'lats', 'traps'],
  'face pull': ['shoulders', 'traps', 'back'],
  // Shoulders
  'overhead press': ['shoulders', 'triceps'],
  'military press': ['shoulders', 'triceps'],
  'lateral raise': ['shoulders'],
  'front raise': ['shoulders'],
  'rear delt fly': ['shoulders', 'back'],
  'arnold press': ['shoulders', 'triceps'],
  'upright row': ['shoulders', 'traps'],
  'shrug': ['traps'],
  // Arms
  'bicep curl': ['biceps'],
  'hammer curl': ['biceps', 'forearms'],
  'preacher curl': ['biceps'],
  'concentration curl': ['biceps'],
  'tricep pushdown': ['triceps'],
  'tricep extension': ['triceps'],
  'skull crusher': ['triceps'],
  'dip': ['triceps', 'chest'],
  'wrist curl': ['forearms'],
  // Legs
  'squat': ['quads', 'glutes', 'hamstrings', 'core'],
  'front squat': ['quads', 'core', 'glutes'],
  'leg press': ['quads', 'glutes', 'hamstrings'],
  'lunge': ['quads', 'glutes', 'hamstrings'],
  'bulgarian split squat': ['quads', 'glutes'],
  'leg extension': ['quads'],
  'leg curl': ['hamstrings'],
  'romanian deadlift': ['hamstrings', 'glutes', 'back'],
  'hip thrust': ['glutes', 'hamstrings'],
  'calf raise': ['calves'],
  'goblet squat': ['quads', 'glutes', 'core'],
  'step up': ['quads', 'glutes'],
  // Core
  'plank': ['core', 'obliques'],
  'crunch': ['core'],
  'sit up': ['core', 'hip_flexors'],
  'russian twist': ['core', 'obliques'],
  'leg raise': ['core', 'hip_flexors'],
  'hanging leg raise': ['core', 'hip_flexors'],
  'ab wheel': ['core'],
  'cable crunch': ['core'],
  'side plank': ['obliques', 'core'],
  'mountain climber': ['core', 'hip_flexors'],
  // Full body
  'clean and press': ['shoulders', 'back', 'quads', 'glutes', 'core', 'traps'],
  'thruster': ['quads', 'shoulders', 'core', 'glutes'],
  'burpee': ['chest', 'core', 'quads', 'shoulders'],
  'kettlebell swing': ['glutes', 'hamstrings', 'core', 'shoulders'],
};

export function getExerciseMuscles(name: string): string[] {
  const lower = name.toLowerCase().trim();
  if (exerciseMuscleMap[lower]) return exerciseMuscleMap[lower];
  // Fuzzy match
  for (const [key, muscles] of Object.entries(exerciseMuscleMap)) {
    if (lower.includes(key) || key.includes(lower)) return muscles;
  }
  return [];
}
