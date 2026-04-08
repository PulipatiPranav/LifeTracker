import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { PageHeader, StatCard, Tabs, EmptyState, Button, Modal } from '@/components/ui';
import { computeCorrelations, generateInsights, getBestWorstDays, generateWeeklyReport, METRIC_LABELS } from '@/utils/patterns';
import { Sparkles, TrendingUp, TrendingDown, BarChart3, FileText, Settings } from 'lucide-react';
import type { CompositeWeights } from '@/types';
import { formatDate } from '@/utils/helpers';

export default function PatternsPage() {
  const { data, setCompositeWeights } = useStore();
  const [activeTab, setActiveTab] = useState('correlations');
  const [showWeights, setShowWeights] = useState(false);
  const [weights, setWeights] = useState<CompositeWeights>(data.compositeWeights);

  const correlations = useMemo(() => computeCorrelations(data), [data]);
  const insights = useMemo(() => generateInsights(data), [data]);
  const bestWorst = useMemo(() => getBestWorstDays(data), [data]);
  const weeklyReport = useMemo(() => generateWeeklyReport(data), [data]);

  const significantCorrelations = correlations.filter(c => c.significant);
  const allMetricNames = [...new Set(correlations.flatMap(c => [c.metricA, c.metricB]))];

  const handleSaveWeights = () => {
    setCompositeWeights(weights);
    setShowWeights(false);
  };

  const getCorrelationColor = (r: number) => {
    if (r > 0.6) return 'bg-emerald-500';
    if (r > 0.3) return 'bg-emerald-500/60';
    if (r > 0) return 'bg-emerald-500/20';
    if (r > -0.3) return 'bg-red-500/20';
    if (r > -0.6) return 'bg-red-500/60';
    return 'bg-red-500';
  };

  const getCorrelationTextColor = (r: number) => {
    if (Math.abs(r) > 0.3) return 'text-white';
    return 'text-[var(--color-text-tertiary)]';
  };

  return (
    <div>
      <PageHeader
        title="Pattern Engine"
        subtitle="Discover hidden patterns in your data"
        action={
          <Button variant="secondary" onClick={() => setShowWeights(true)}>
            <Settings size={16} /> Weights
          </Button>
        }
      />

      <Tabs
        tabs={['correlations', 'insights', 'best/worst', 'weekly report']}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-6">
        {/* CORRELATIONS TAB */}
        {activeTab === 'correlations' && (
          <div>
            {correlations.length === 0 ? (
              <EmptyState message="Not enough data yet. Log at least 7 days across multiple modules to see correlations." icon={<BarChart3 size={48} />} />
            ) : (
              <>
                {/* Correlation Matrix */}
                <div className="glass-card p-5 mb-6 overflow-x-auto">
                  <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Correlation Matrix</h3>
                  <div className="min-w-[600px]">
                    <div className="grid" style={{ gridTemplateColumns: `120px repeat(${allMetricNames.length}, 1fr)` }}>
                      {/* Header */}
                      <div />
                      {allMetricNames.map(name => (
                        <div key={name} className="text-[10px] text-[var(--color-text-tertiary)] p-1 text-center truncate -rotate-45 origin-bottom-left h-16 flex items-end justify-center">
                          {name}
                        </div>
                      ))}

                      {/* Rows */}
                      {allMetricNames.map(rowName => (
                        <>
                          <div key={`label-${rowName}`} className="text-xs text-[var(--color-text-secondary)] p-1 flex items-center truncate">
                            {rowName}
                          </div>
                          {allMetricNames.map(colName => {
                            if (rowName === colName) {
                              return <div key={`${rowName}-${colName}`} className="p-1"><div className="w-full h-8 rounded bg-[var(--color-bg-hover)] flex items-center justify-center text-xs text-[var(--color-text-tertiary)]">1.0</div></div>;
                            }
                            const corr = correlations.find(
                              c => (c.metricA === rowName && c.metricB === colName) || (c.metricA === colName && c.metricB === rowName)
                            );
                            if (!corr) return <div key={`${rowName}-${colName}`} className="p-1"><div className="w-full h-8 rounded bg-[var(--color-bg-elevated)]" /></div>;
                            return (
                              <div key={`${rowName}-${colName}`} className="p-1">
                                <div
                                  className={`w-full h-8 rounded flex items-center justify-center text-[10px] font-medium ${getCorrelationColor(corr.coefficient)} ${getCorrelationTextColor(corr.coefficient)}`}
                                  title={`${corr.metricA} ↔ ${corr.metricB}: r=${corr.coefficient} (n=${corr.sampleSize})`}
                                >
                                  {corr.coefficient.toFixed(2)}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-xs text-[var(--color-text-tertiary)]">
                    <span>Strong negative</span>
                    <div className="flex gap-0.5">
                      {['bg-red-500', 'bg-red-500/60', 'bg-red-500/20', 'bg-emerald-500/20', 'bg-emerald-500/60', 'bg-emerald-500'].map(c => (
                        <div key={c} className={`w-6 h-3 rounded ${c}`} />
                      ))}
                    </div>
                    <span>Strong positive</span>
                  </div>
                </div>

                {/* Significant correlations list */}
                {significantCorrelations.length > 0 && (
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Significant Correlations (|r| &gt; 0.3)</h3>
                    <div className="space-y-2">
                      {significantCorrelations.map((c, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-bg-elevated)]"
                        >
                          <div className="flex items-center gap-2">
                            {c.coefficient > 0 ? (
                              <TrendingUp size={16} className="text-emerald-400" />
                            ) : (
                              <TrendingDown size={16} className="text-red-400" />
                            )}
                            <span className="text-sm">{c.metricA} ↔ {c.metricB}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-mono font-medium ${c.coefficient > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              r = {c.coefficient.toFixed(2)}
                            </span>
                            <span className="text-xs text-[var(--color-text-tertiary)]">n={c.sampleSize}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <div>
            {insights.length === 0 ? (
              <EmptyState message="Not enough data to generate insights. Log at least 7 days across multiple modules." icon={<Sparkles size={48} />} />
            ) : (
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="glass-card glass-card-hover p-5"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles size={18} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm leading-relaxed">{insight.text}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                          r = {insight.coefficient.toFixed(2)} · {insight.sampleSize} data points
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BEST/WORST DAYS TAB */}
        {activeTab === 'best/worst' && (
          <div>
            {!bestWorst ? (
              <EmptyState message="Need at least 10 days of data to determine best and worst days." icon={<BarChart3 size={48} />} />
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-4">🏆 Best Days (Top {bestWorst.topN})</h3>
                  <div className="space-y-2 mb-4">
                    {bestWorst.top.map(day => (
                      <div key={day.date} className="flex items-center justify-between py-1">
                        <span className="text-sm text-[var(--color-text-secondary)]">{formatDate(day.date)}</span>
                        <span className="text-sm font-medium text-emerald-400">{day.score}/100</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-red-400 mb-4">📉 Worst Days (Bottom {bestWorst.topN})</h3>
                  <div className="space-y-2 mb-4">
                    {bestWorst.bottom.map(day => (
                      <div key={day.date} className="flex items-center justify-between py-1">
                        <span className="text-sm text-[var(--color-text-secondary)]">{formatDate(day.date)}</span>
                        <span className="text-sm font-medium text-red-400">{day.score}/100</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-5 md:col-span-2">
                  <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">Metric Comparison: Best vs Worst Days</h3>
                  <div className="space-y-3">
                    {Object.entries(bestWorst.comparison).map(([key, vals]) => {
                      if (vals.diff === undefined) return null;
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                      return (
                        <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-bg-elevated)]">
                          <span className="text-sm capitalize">{label}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-emerald-400">Best: {vals.best?.toFixed(1)}</span>
                            <span className="text-xs text-red-400">Worst: {vals.worst?.toFixed(1)}</span>
                            <span className={`text-sm font-medium ${vals.diff! > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {vals.diff! > 0 ? '+' : ''}{vals.diff!.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WEEKLY REPORT TAB */}
        {activeTab === 'weekly report' && (
          <div>
            {!weeklyReport ? (
              <EmptyState message="Need at least 3 days of data this week to generate a report." icon={<FileText size={48} />} />
            ) : (
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FileText size={20} className="text-[var(--color-accent)]" />
                  <h3 className="text-lg font-semibold">Weekly Report</h3>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {formatDate(weeklyReport.weekStart)} — {formatDate(weeklyReport.weekEnd)}
                  </span>
                </div>

                {/* Metric changes */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Week-over-Week Changes</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(weeklyReport.metricChanges).map(([metric, vals]) => (
                      <div key={metric} className="p-3 rounded-xl bg-[var(--color-bg-elevated)]">
                        <p className="text-xs text-[var(--color-text-tertiary)]">{metric}</p>
                        <p className="text-lg font-bold mt-1">{vals.current || '—'}</p>
                        {vals.previous > 0 && (
                          <p className={`text-xs mt-0.5 ${vals.change > 0 ? 'text-emerald-400' : vals.change < 0 ? 'text-red-400' : 'text-[var(--color-text-tertiary)]'}`}>
                            {vals.change > 0 ? '↑' : vals.change < 0 ? '↓' : '→'} {Math.abs(vals.change).toFixed(1)} from last week
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top correlations this week */}
                {weeklyReport.topCorrelations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Top Correlations Detected</h4>
                    <div className="space-y-2">
                      {weeklyReport.topCorrelations.map((c, i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-bg-elevated)]">
                          <span className="text-sm">{c.metricA} ↔ {c.metricB}</span>
                          <span className={`text-sm font-mono ${c.coefficient > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            r = {c.coefficient.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weights Modal */}
      <Modal open={showWeights} onClose={() => setShowWeights(false)} title="Composite Score Weights">
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Adjust how much each metric contributes to your daily composite score. Values should sum to 1.0.
          </p>
          {(Object.keys(weights) as (keyof CompositeWeights)[]).map(key => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={weights[key]}
                onChange={e => setWeights({ ...weights, [key]: parseFloat(e.target.value) || 0 })}
                className="w-20 text-right"
              />
            </div>
          ))}
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Sum: {Object.values(weights).reduce((s, v) => s + v, 0).toFixed(2)}
          </p>
          <Button onClick={handleSaveWeights} className="w-full">Save Weights</Button>
        </div>
      </Modal>
    </div>
  );
}
