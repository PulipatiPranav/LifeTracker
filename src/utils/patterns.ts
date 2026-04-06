import type { AppData, Correlation, Insight, DayScore, WeeklyReport, Alert } from '@/types';
import { mean, median, stdDev, last7Days, lastNDays, format, subDays } from './helpers';
import { format as fnsFormat, subWeeks, startOfWeek, endOfWeek, parseISO } from 'date-fns';

// ============== METRIC EXTRACTION ==============
interface DailyMetrics {
  date: string;
  sleepDuration?: number;
  mood?: number;
  energy?: number;
  focusMinutes?: number;
  screentimeMinutes?: number;
  calories?: number;
  protein?: number;
  hydrationGlasses?: number;
  workoutDone?: number; // 0 or 1
  weight?: number;
  spending?: number;
}

export function extractDailyMetrics(data: AppData): DailyMetrics[] {
  const allDates = new Set<string>();
  
  data.sleep.forEach(s => allDates.add(s.date));
  data.mood.forEach(m => allDates.add(m.date));
  data.focus.forEach(f => allDates.add(f.date));
  data.screentime.forEach(s => allDates.add(s.date));
  data.nutrition.forEach(n => allDates.add(n.date));
  data.hydration.forEach(h => allDates.add(h.date));
  data.workouts.forEach(w => allDates.add(w.date));
  data.bodyMetrics.forEach(b => allDates.add(b.date));
  data.finance.forEach(f => allDates.add(f.date));

  const dates = [...allDates].sort();

  return dates.map(date => {
    const sleep = data.sleep.find(s => s.date === date);
    const mood = data.mood.find(m => m.date === date);
    const focus = data.focus.find(f => f.date === date);
    const screen = data.screentime.find(s => s.date === date);
    const nutrition = data.nutrition.find(n => n.date === date);
    const hydration = data.hydration.find(h => h.date === date);
    const workout = data.workouts.find(w => w.date === date);
    const body = data.bodyMetrics.find(b => b.date === date);
    const dailySpend = data.finance.filter(f => f.date === date).reduce((s, f) => s + f.amount, 0);

    return {
      date,
      sleepDuration: sleep?.duration,
      mood: mood?.mood,
      energy: mood?.energy,
      focusMinutes: focus?.totalMinutes,
      screentimeMinutes: screen?.total,
      calories: nutrition?.calories,
      protein: nutrition?.protein,
      hydrationGlasses: hydration?.glasses,
      workoutDone: workout ? 1 : 0,
      weight: body?.weight,
      spending: dailySpend || undefined,
    };
  });
}

// ============== PEARSON CORRELATION ==============
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  
  const meanX = mean(x);
  const meanY = mean(y);
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return 0;
  return numerator / denom;
}

// ============== CORRELATION MATRIX ==============
const METRIC_LABELS: Record<string, string> = {
  sleepDuration: 'Sleep Duration',
  mood: 'Mood',
  energy: 'Energy',
  focusMinutes: 'Focus Time',
  screentimeMinutes: 'Screen Time',
  calories: 'Calories',
  protein: 'Protein',
  hydrationGlasses: 'Hydration',
  workoutDone: 'Workout',
  weight: 'Weight',
  spending: 'Spending',
};

const METRIC_KEYS = Object.keys(METRIC_LABELS) as (keyof DailyMetrics)[];

export function computeCorrelations(data: AppData): Correlation[] {
  const metrics = extractDailyMetrics(data);
  const correlations: Correlation[] = [];

  for (let i = 0; i < METRIC_KEYS.length; i++) {
    for (let j = i + 1; j < METRIC_KEYS.length; j++) {
      const keyA = METRIC_KEYS[i];
      const keyB = METRIC_KEYS[j];

      const pairs: { a: number; b: number }[] = [];
      for (const m of metrics) {
        const a = m[keyA] as number | undefined;
        const b = m[keyB] as number | undefined;
        if (a !== undefined && b !== undefined) {
          pairs.push({ a, b });
        }
      }

      if (pairs.length >= 7) {
        const r = pearsonCorrelation(
          pairs.map(p => p.a),
          pairs.map(p => p.b)
        );
        correlations.push({
          metricA: METRIC_LABELS[keyA] || keyA,
          metricB: METRIC_LABELS[keyB] || keyB,
          coefficient: Math.round(r * 100) / 100,
          sampleSize: pairs.length,
          significant: Math.abs(r) > 0.3,
        });
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
}

// ============== AUTO-GENERATED INSIGHTS ==============
export function generateInsights(data: AppData): Insight[] {
  const metrics = extractDailyMetrics(data);
  const correlations = computeCorrelations(data);
  const insights: Insight[] = [];

  for (const corr of correlations) {
    if (!corr.significant || corr.sampleSize < 7) continue;

    const keyA = Object.entries(METRIC_LABELS).find(([, v]) => v === corr.metricA)?.[0] as keyof DailyMetrics | undefined;
    const keyB = Object.entries(METRIC_LABELS).find(([, v]) => v === corr.metricB)?.[0] as keyof DailyMetrics | undefined;
    if (!keyA || !keyB) continue;

    // Get paired data
    const pairedA: number[] = [];
    const pairedB: number[] = [];
    for (const m of metrics) {
      const a = m[keyA] as number | undefined;
      const b = m[keyB] as number | undefined;
      if (a !== undefined && b !== undefined) {
        pairedA.push(a);
        pairedB.push(b);
      }
    }

    const medianB = median(pairedB);
    const aboveMedianA: number[] = [];
    const belowMedianA: number[] = [];

    for (let i = 0; i < pairedB.length; i++) {
      if (pairedB[i] >= medianB) {
        aboveMedianA.push(pairedA[i]);
      } else {
        belowMedianA.push(pairedA[i]);
      }
    }

    const avgAbove = mean(aboveMedianA);
    const avgBelow = mean(belowMedianA);
    const direction = corr.coefficient > 0 ? 'higher' : 'lower';
    const threshold = medianB.toFixed(1);

    const text = `${corr.metricA} tends to be ${direction} on days when ${corr.metricB} is above ${threshold} (avg ${avgAbove.toFixed(1)} vs ${avgBelow.toFixed(1)})`;

    insights.push({
      id: `${keyA}-${keyB}`,
      text,
      coefficient: corr.coefficient,
      sampleSize: corr.sampleSize,
      metricA: corr.metricA,
      metricB: corr.metricB,
    });
  }

  return insights;
}

// ============== COMPOSITE DAY SCORES ==============
export function computeDayScores(data: AppData): DayScore[] {
  const metrics = extractDailyMetrics(data);
  const w = data.compositeWeights;

  // Normalize each metric to 0-1
  const sleepVals = metrics.map(m => m.sleepDuration).filter((v): v is number => v !== undefined);
  const moodVals = metrics.map(m => m.mood).filter((v): v is number => v !== undefined);
  const energyVals = metrics.map(m => m.energy).filter((v): v is number => v !== undefined);
  const focusVals = metrics.map(m => m.focusMinutes).filter((v): v is number => v !== undefined);

  const maxSleep = Math.max(...sleepVals, 10);
  const maxFocus = Math.max(...focusVals, 240);

  return metrics.map(m => {
    let score = 0;
    let totalWeight = 0;
    const dayMetrics: Record<string, number> = {};

    if (m.mood !== undefined) {
      score += (m.mood / 5) * w.mood;
      totalWeight += w.mood;
      dayMetrics.mood = m.mood;
    }
    if (m.energy !== undefined) {
      score += (m.energy / 5) * w.energy;
      totalWeight += w.energy;
      dayMetrics.energy = m.energy;
    }
    if (m.focusMinutes !== undefined) {
      score += Math.min(m.focusMinutes / maxFocus, 1) * w.focusHours;
      totalWeight += w.focusHours;
      dayMetrics.focusMinutes = m.focusMinutes;
    }
    if (m.sleepDuration !== undefined) {
      score += Math.min(m.sleepDuration / maxSleep, 1) * w.sleepDuration;
      totalWeight += w.sleepDuration;
      dayMetrics.sleepDuration = m.sleepDuration;
    }
    if (m.workoutDone !== undefined) {
      score += m.workoutDone * w.workoutCompleted;
      totalWeight += w.workoutCompleted;
      dayMetrics.workoutDone = m.workoutDone;
    }

    if (m.screentimeMinutes !== undefined) dayMetrics.screentimeMinutes = m.screentimeMinutes;
    if (m.hydrationGlasses !== undefined) dayMetrics.hydrationGlasses = m.hydrationGlasses;
    if (m.calories !== undefined) dayMetrics.calories = m.calories;

    return {
      date: m.date,
      score: totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0,
      metrics: dayMetrics,
    };
  });
}

// ============== BEST / WORST DAYS ==============
export function getBestWorstDays(data: AppData) {
  const scores = computeDayScores(data).filter(s => s.score > 0);
  if (scores.length < 10) return null;

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const topN = Math.max(1, Math.floor(sorted.length * 0.1));
  const top = sorted.slice(0, topN);
  const bottom = sorted.slice(-topN);

  const avgMetric = (days: DayScore[], key: string) => {
    const vals = days.map(d => d.metrics[key]).filter((v): v is number => v !== undefined);
    return vals.length ? mean(vals) : undefined;
  };

  const metricKeys = ['mood', 'energy', 'sleepDuration', 'focusMinutes', 'screentimeMinutes', 'hydrationGlasses', 'workoutDone'];
  const comparison: Record<string, { best: number | undefined; worst: number | undefined; diff: number | undefined }> = {};

  for (const key of metricKeys) {
    const best = avgMetric(top, key);
    const worst = avgMetric(bottom, key);
    comparison[key] = {
      best,
      worst,
      diff: best !== undefined && worst !== undefined ? best - worst : undefined,
    };
  }

  return { top, bottom, comparison, topN };
}

// ============== WEEKLY REPORT ==============
export function generateWeeklyReport(data: AppData): WeeklyReport | null {
  const now = new Date();
  const weekStart = fnsFormat(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = fnsFormat(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const prevWeekStart = fnsFormat(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const prevWeekEnd = fnsFormat(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const metrics = extractDailyMetrics(data);
  const thisWeek = metrics.filter(m => m.date >= weekStart && m.date <= weekEnd);
  const lastWeek = metrics.filter(m => m.date >= prevWeekStart && m.date <= prevWeekEnd);

  if (thisWeek.length < 3) return null;

  const avgForWeek = (week: DailyMetrics[], key: keyof DailyMetrics) => {
    const vals = week.map(m => m[key] as number | undefined).filter((v): v is number => v !== undefined);
    return vals.length ? mean(vals) : 0;
  };

  const metricKeys: (keyof DailyMetrics)[] = ['sleepDuration', 'mood', 'energy', 'focusMinutes', 'screentimeMinutes', 'hydrationGlasses', 'calories'];
  const metricChanges: Record<string, { current: number; previous: number; change: number }> = {};

  for (const key of metricKeys) {
    const current = avgForWeek(thisWeek, key);
    const previous = avgForWeek(lastWeek, key);
    metricChanges[METRIC_LABELS[key] || key] = {
      current: Math.round(current * 10) / 10,
      previous: Math.round(previous * 10) / 10,
      change: Math.round((current - previous) * 10) / 10,
    };
  }

  const correlations = computeCorrelations(data);
  const topCorrelations = correlations.filter(c => c.significant).slice(0, 3);

  return {
    weekStart,
    weekEnd,
    topCorrelations,
    metricChanges,
    generatedAt: new Date().toISOString(),
  };
}

// ============== ALERTS ==============
export function computeAlerts(data: AppData): Alert[] {
  const alerts: Alert[] = [];
  const todayStr = fnsFormat(new Date(), 'yyyy-MM-dd');

  const modules: { name: string; dates: string[] }[] = [
    { name: 'Sleep', dates: data.sleep.map(s => s.date) },
    { name: 'Mood', dates: data.mood.map(m => m.date) },
    { name: 'Nutrition', dates: data.nutrition.map(n => n.date) },
    { name: 'Hydration', dates: data.hydration.map(h => h.date) },
    { name: 'Screentime', dates: data.screentime.map(s => s.date) },
  ];

  for (const mod of modules) {
    if (mod.dates.length === 0) continue;
    const sorted = [...mod.dates].sort().reverse();
    const lastDate = sorted[0];
    const daysSince = Math.abs(
      Math.round((new Date(todayStr).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
    );
    if (daysSince >= 3) {
      alerts.push({
        id: `missing-${mod.name}`,
        type: 'missing_data',
        module: mod.name,
        message: `No ${mod.name.toLowerCase()} data logged for ${daysSince} days`,
        date: todayStr,
        dismissed: false,
      });
    }
  }

  // Check rolling averages dropping below baseline
  const metrics = extractDailyMetrics(data);
  const last30 = metrics.filter(m => {
    const d = new Date(m.date);
    const t = new Date(todayStr);
    return (t.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 30;
  });
  const last7 = last30.filter(m => {
    const d = new Date(m.date);
    const t = new Date(todayStr);
    return (t.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  });

  const checkBaseline = (key: keyof DailyMetrics, label: string) => {
    const vals30 = last30.map(m => m[key] as number | undefined).filter((v): v is number => v !== undefined);
    const vals7 = last7.map(m => m[key] as number | undefined).filter((v): v is number => v !== undefined);
    if (vals30.length >= 14 && vals7.length >= 3) {
      const baseline = mean(vals30);
      const recent = mean(vals7);
      if (baseline > 0 && recent < baseline * 0.8) {
        alerts.push({
          id: `baseline-${key}`,
          type: 'below_baseline',
          module: label,
          message: `${label} 7-day average (${recent.toFixed(1)}) is below your 30-day baseline (${baseline.toFixed(1)})`,
          date: todayStr,
          dismissed: false,
        });
      }
    }
  };

  checkBaseline('sleepDuration', 'Sleep Duration');
  checkBaseline('mood', 'Mood');
  checkBaseline('energy', 'Energy');
  checkBaseline('focusMinutes', 'Focus Time');

  return alerts;
}

export { METRIC_LABELS, METRIC_KEYS };
