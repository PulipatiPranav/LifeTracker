// ==================== HABITS ====================
export type HabitCategory = 'Health' | 'Focus' | 'Finance' | 'Social' | 'Mindset';
export type HabitType = 'good' | 'bad';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  category: HabitCategory;
  linkedHabitIds: string[];
  createdAt: string;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

// ==================== SLEEP ====================
export interface SleepEntry {
  id: string;
  date: string;
  bedtime: string; // HH:mm
  wakeTime: string; // HH:mm
  duration: number; // hours
  isAnomaly: boolean;
  anomalyType?: 'late_night' | 'nap' | 'short_sleep' | 'oversleep';
}

// ==================== SCREENTIME ====================
export type ScreenCategory = 'Social Media' | 'Work/Study' | 'Entertainment' | 'Other';

export interface ScreentimeEntry {
  id: string;
  date: string;
  categories: Record<ScreenCategory, number>; // minutes
  total: number;
}

// ==================== WORKOUTS ====================
export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'core' | 'quads' | 'hamstrings' | 'glutes' | 'calves'
  | 'traps' | 'lats' | 'obliques' | 'hip_flexors' | 'adductors' | 'neck';

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  muscleGroups: MuscleGroup[];
}

export interface WorkoutEntry {
  id: string;
  date: string;
  exercises: Exercise[];
  duration: number; // minutes
  notes: string;
}

// ==================== NUTRITION ====================
export interface NutritionEntry {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ==================== HYDRATION ====================
export interface HydrationEntry {
  id: string;
  date: string;
  glasses: number;
  goal: number;
}

// ==================== MOOD & ENERGY ====================
export interface MoodEntry {
  id: string;
  date: string;
  mood: number; // 1-5
  energy: number; // 1-5
}

// ==================== BODY METRICS ====================
export interface BodyMetricsEntry {
  id: string;
  date: string;
  weight: number; // kg
  bodyFat?: number; // %
  bmi?: number;
}

// ==================== FOCUS ====================
export interface FocusSession {
  id: string;
  date: string;
  startTime: string;
  duration: number; // minutes
  type: 'pomodoro' | 'custom';
  completed: boolean;
}

export interface FocusEntry {
  id: string;
  date: string;
  totalMinutes: number;
  sessions: FocusSession[];
}

// ==================== FINANCE ====================
export type SpendCategory = 'Food' | 'Transport' | 'Entertainment' | 'Shopping' | 'Bills' | 'Health' | 'Education' | 'Other';

export interface FinanceEntry {
  id: string;
  date: string;
  amount: number;
  category: SpendCategory;
  description: string;
}

export interface MonthlyBudget {
  id: string;
  month: string; // YYYY-MM
  budgets: Record<SpendCategory, number>;
}

// ==================== GOALS ====================
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: GoalStatus;
  linkedHabitIds: string[];
  subTasks: SubTask[];
  createdAt: string;
}

// ==================== PATTERN ENGINE ====================
export interface Correlation {
  metricA: string;
  metricB: string;
  coefficient: number;
  sampleSize: number;
  significant: boolean;
}

export interface Insight {
  id: string;
  text: string;
  coefficient: number;
  sampleSize: number;
  metricA: string;
  metricB: string;
}

export interface DayScore {
  date: string;
  score: number;
  metrics: Record<string, number>;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  topCorrelations: Correlation[];
  metricChanges: Record<string, { current: number; previous: number; change: number }>;
  generatedAt: string;
}

// ==================== ALERTS ====================
export interface Alert {
  id: string;
  type: 'missing_data' | 'below_baseline' | 'streak_broken';
  module: string;
  message: string;
  date: string;
  dismissed: boolean;
}

// ==================== COMPOSITE WEIGHTS ====================
export interface CompositeWeights {
  mood: number;
  energy: number;
  focusHours: number;
  sleepDuration: number;
  workoutCompleted: number;
}

// ==================== STORE ====================
export interface AppData {
  habits: Habit[];
  habitEntries: HabitEntry[];
  sleep: SleepEntry[];
  screentime: ScreentimeEntry[];
  workouts: WorkoutEntry[];
  nutrition: NutritionEntry[];
  hydration: HydrationEntry[];
  mood: MoodEntry[];
  bodyMetrics: BodyMetricsEntry[];
  focus: FocusEntry[];
  finance: FinanceEntry[];
  goals: Goal[];
  monthlyBudgets: MonthlyBudget[];
  compositeWeights: CompositeWeights;
  alerts: Alert[];
}
