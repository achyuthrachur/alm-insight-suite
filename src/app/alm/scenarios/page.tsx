'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  BarChart3,
  LineChart,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { ChartContainer } from '@/components/alm/charts/ChartContainer';
import { YieldCurveViewer } from '@/components/alm/charts/YieldCurveViewer';
import { cn } from '@/lib/utils/cn';

export default function ScenariosPage() {
  const { isLoading, scenarioSet, curves, metrics, filters, setFilters } = useALM();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Scenario comparison data
  const scenarioComparison = useMemo(() => {
    if (!scenarioSet || !metrics) return [];

    return scenarioSet.scenarios.map((scenario) => {
      const m = metrics[scenario.scenarioId];
      return {
        scenario,
        niiImpact: m?.nii.impactAmount || 0,
        niiImpactPercent: m?.nii.impactPercent || 0,
        eveImpact: m?.eve.impactAmount || 0,
        eveImpactPercent: m?.eve.impactPercent || 0,
        doe: m?.duration.equityDuration || 0,
        dv01: m?.duration.dv01 || 0,
        limits: m?.limits || [],
      };
    });
  }, [scenarioSet, metrics]);

  // Repricing gap data
  const repricingGapData = useMemo(() => {
    const baseMetrics = metrics?.['base'];
    if (!baseMetrics) return [];

    return baseMetrics.repricing.map((gap) => ({
      bucket: gap.bucket,
      assets: gap.assets / 1_000_000,
      liabilities: -(gap.liabilities / 1_000_000),
      gap: gap.gap / 1_000_000,
    }));
  }, [metrics]);

  // EVE Waterfall data
  const eveWaterfallData = useMemo(() => {
    const stressMetrics = metrics?.['up_200'];
    if (!stressMetrics) return [];

    return [
      { name: 'Base EVE', value: stressMetrics.eve.baseEVE / 1_000_000, isTotal: true },
      { name: 'Asset PV', value: stressMetrics.eve.assetPVChange / 1_000_000 },
      { name: 'Liability PV', value: -stressMetrics.eve.liabilityPVChange / 1_000_000 },
      { name: 'Derivative PV', value: stressMetrics.eve.derivativePVChange / 1_000_000 },
      { name: 'Stressed EVE', value: stressMetrics.eve.stressedEVE / 1_000_000, isTotal: true },
    ];
  }, [metrics]);

  const handleScenarioToggle = (scenarioId: string) => {
    const current = filters.selectedScenarios;
    if (current.includes(scenarioId)) {
      setFilters({ selectedScenarios: current.filter((s) => s !== scenarioId) });
    } else {
      setFilters({ selectedScenarios: [...current, scenarioId] });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-96 rounded-xl" />
          <div className="skeleton h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alm-text-dark dark:text-alm-text-primary">
            Interest Rate Risk
          </h1>
          <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
            Scenario analysis and sensitivity metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'table'
                ? 'bg-alm-accent text-white'
                : 'text-alm-text-secondary hover:bg-slate-100 dark:hover:bg-alm-bg-tertiary'
            )}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'cards'
                ? 'bg-alm-accent text-white'
                : 'text-alm-text-secondary hover:bg-slate-100 dark:hover:bg-alm-bg-tertiary'
            )}
          >
            <LineChart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Yield Curve Viewer */}
      {scenarioSet && curves && (
        <YieldCurveViewer
          curves={curves}
          scenarios={scenarioSet.scenarios}
          selectedScenarios={filters.selectedScenarios}
          onScenarioToggle={handleScenarioToggle}
        />
      )}

      {/* Scenario Comparison Table */}
      <ChartContainer
        title="Scenario Comparison"
        subtitle="Key risk metrics across all scenarios"
        tooltip="Compare NII and EVE sensitivity across different rate shock scenarios"
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th className="text-right">NII Impact</th>
                <th className="text-right">NII %</th>
                <th className="text-right">EVE Impact</th>
                <th className="text-right">EVE %</th>
                <th className="text-right">DOE</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {scenarioComparison.map((row) => {
                const hasBreaches = row.limits.some((l) => l.status === 'breach');
                const hasWarnings = row.limits.some((l) => l.status === 'warning');

                return (
                  <motion.tr
                    key={row.scenario.scenarioId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group cursor-pointer"
                    onClick={() => handleScenarioToggle(row.scenario.scenarioId)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            filters.selectedScenarios.includes(row.scenario.scenarioId)
                              ? 'bg-alm-accent'
                              : 'bg-slate-300 dark:bg-alm-text-muted'
                          )}
                        />
                        <div>
                          <p className="font-medium">{row.scenario.name}</p>
                          <p className="text-xs text-alm-text-muted">
                            {row.scenario.tags.join(', ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right tabular-nums">
                      <span
                        className={cn(
                          'font-medium',
                          row.niiImpact > 0 ? 'text-alm-success' : row.niiImpact < 0 ? 'text-alm-danger' : ''
                        )}
                      >
                        {row.niiImpact > 0 ? '+' : ''}${(row.niiImpact / 1_000_000).toFixed(1)}M
                      </span>
                    </td>
                    <td className="text-right tabular-nums">
                      <div className="flex items-center justify-end gap-1">
                        {row.niiImpactPercent > 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-alm-success" />
                        ) : row.niiImpactPercent < 0 ? (
                          <ArrowDownRight className="w-3 h-3 text-alm-danger" />
                        ) : (
                          <Minus className="w-3 h-3 text-alm-text-muted" />
                        )}
                        <span
                          className={cn(
                            row.niiImpactPercent > 0 ? 'text-alm-success' : row.niiImpactPercent < 0 ? 'text-alm-danger' : ''
                          )}
                        >
                          {row.niiImpactPercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-right tabular-nums">
                      <span
                        className={cn(
                          'font-medium',
                          row.eveImpact > 0 ? 'text-alm-success' : row.eveImpact < 0 ? 'text-alm-danger' : ''
                        )}
                      >
                        {row.eveImpact > 0 ? '+' : ''}${(row.eveImpact / 1_000_000).toFixed(1)}M
                      </span>
                    </td>
                    <td className="text-right tabular-nums">
                      <div className="flex items-center justify-end gap-1">
                        {row.eveImpactPercent > 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-alm-success" />
                        ) : row.eveImpactPercent < 0 ? (
                          <ArrowDownRight className="w-3 h-3 text-alm-danger" />
                        ) : (
                          <Minus className="w-3 h-3 text-alm-text-muted" />
                        )}
                        <span
                          className={cn(
                            row.eveImpactPercent > 0 ? 'text-alm-success' : row.eveImpactPercent < 0 ? 'text-alm-danger' : ''
                          )}
                        >
                          {row.eveImpactPercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-right tabular-nums">
                      {row.doe.toFixed(1)} yrs
                    </td>
                    <td className="text-center">
                      {hasBreaches ? (
                        <span className="badge-danger">Breach</span>
                      ) : hasWarnings ? (
                        <span className="badge-warning">Warning</span>
                      ) : (
                        <span className="badge-success">OK</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Bottom Row - Repricing Gap & EVE Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repricing Gap */}
        <ChartContainer
          title="Repricing Gap Ladder"
          subtitle="Asset vs liability repricing by time bucket"
          tooltip="Shows the difference between assets and liabilities repricing in each time bucket. Positive gaps benefit from rising rates."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repricingGapData} stackOffset="sign">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-alm-border"
                />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}M`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    return (
                      <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-sm mb-2">{label}</p>
                        {payload.map((entry: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between gap-4 text-sm">
                            <span style={{ color: entry.color }}>{entry.name}</span>
                            <span className="font-medium tabular-nums">
                              ${Math.abs(entry.value).toFixed(0)}M
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="assets" name="Assets" fill="#22c55e" stackId="stack" />
                <Bar dataKey="liabilities" name="Liabilities" fill="#ef4444" stackId="stack" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* EVE Waterfall */}
        <ChartContainer
          title="EVE Decomposition (+200bp)"
          subtitle="Sources of EVE change under rate stress"
          tooltip="Waterfall showing how EVE changes from base to stressed scenario, broken down by component."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eveWaterfallData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-alm-border"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `$${value}M`}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-sm">{data.name}</p>
                        <p className="text-lg font-bold tabular-nums">
                          ${data.value.toFixed(1)}M
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {eveWaterfallData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.isTotal
                          ? '#6366f1'
                          : entry.value >= 0
                          ? '#22c55e'
                          : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}
