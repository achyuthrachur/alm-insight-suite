'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Droplets, AlertTriangle, Check, Clock, Shield, TrendingUp } from 'lucide-react';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { ChartContainer } from '@/components/alm/charts/ChartContainer';
import { cn } from '@/lib/utils/cn';

export default function LiquidityPage() {
  const { isLoading, liquidity } = useALM();

  // Cashflow ladder data
  const cashflowData = useMemo(() => {
    if (!liquidity) return [];
    return liquidity.cashflowLadder.map((bucket) => ({
      bucket: bucket.bucket,
      inflows: bucket.inflows / 1_000_000,
      outflows: -(bucket.outflows / 1_000_000),
      net: bucket.netFlow / 1_000_000,
      cumulative: bucket.cumulativeGap / 1_000_000,
    }));
  }, [liquidity]);

  // Cumulative gap for area chart
  const cumulativeGapData = useMemo(() => {
    if (!liquidity) return [];
    let cumulative = 0;
    return liquidity.cashflowLadder.map((bucket) => {
      cumulative += bucket.netFlow;
      return {
        bucket: bucket.bucket,
        gap: cumulative / 1_000_000,
        available: bucket.availableLiquidity / 1_000_000,
      };
    });
  }, [liquidity]);

  if (isLoading || !liquidity) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  const survivalPercent = (liquidity.survivalHorizon / liquidity.survivalHorizonTarget) * 100;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alm-text-dark dark:text-alm-text-primary">
            Liquidity & Funding
          </h1>
          <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
            Cashflow projections, funding analysis, and contingency readiness
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Survival Horizon Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-alm-info/10 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-alm-info" />
            </div>
            <div>
              <p className="text-sm text-alm-text-muted">Survival Horizon</p>
              <p className="text-2xl font-bold">{liquidity.survivalHorizon} days</p>
            </div>
          </div>
          <div className="relative h-3 bg-slate-200 dark:bg-alm-bg-tertiary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(survivalPercent, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                survivalPercent >= 100 ? 'bg-alm-success' : survivalPercent >= 80 ? 'bg-alm-warning' : 'bg-alm-danger'
              )}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-alm-text-dark dark:bg-alm-text-primary"
              style={{ left: '100%', transform: 'translateX(-100%)' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-alm-text-muted">
            <span>0</span>
            <span>Target: {liquidity.survivalHorizonTarget} days</span>
          </div>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-alm-success/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-alm-success" />
            </div>
            <div>
              <p className="text-sm text-alm-text-muted">Readiness Score</p>
              <p className="text-2xl font-bold">{liquidity.overallScore}%</p>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 h-2 rounded-full',
                  i < Math.round(liquidity.overallScore / 10)
                    ? 'bg-alm-success'
                    : 'bg-slate-200 dark:bg-alm-bg-tertiary'
                )}
              />
            ))}
          </div>
        </motion.div>

        {/* Funding Concentration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-alm-warning/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-alm-warning" />
            </div>
            <div>
              <p className="text-sm text-alm-text-muted">Core Funding</p>
              <p className="text-2xl font-bold">
                {liquidity.fundingConcentrations.find((f) => f.sourceName === 'Core Deposits')?.percentOfTotal || 0}%
              </p>
            </div>
          </div>
          <p className="text-xs text-alm-text-muted">
            Stable funding from core deposits
          </p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashflow Ladder */}
        <ChartContainer
          title="Cashflow Ladder"
          subtitle="Projected inflows and outflows by time bucket"
          tooltip="Shows expected cash movements. Green bars are inflows, red bars are outflows."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} stackOffset="sign">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-alm-border"
                />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(v) => `$${Math.abs(v)}M`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    return (
                      <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-sm mb-2">{label}</p>
                        {payload.map((entry: any, idx: number) => (
                          <div key={idx} className="flex justify-between gap-4 text-sm">
                            <span style={{ color: entry.color }}>{entry.name}</span>
                            <span className="font-medium">${Math.abs(entry.value).toFixed(0)}M</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="inflows" name="Inflows" fill="#22c55e" stackId="stack" />
                <Bar dataKey="outflows" name="Outflows" fill="#ef4444" stackId="stack" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>

        {/* Cumulative Gap */}
        <ChartContainer
          title="Cumulative Liquidity Gap"
          subtitle="Running total of net cashflows"
          tooltip="Shows cumulative cash position over time. Negative values indicate funding needs."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeGapData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-alm-border"
                />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tickFormatter={(v) => `$${v}M`} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.[0]) return null;
                    return (
                      <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-sm">{label}</p>
                        <p className="text-sm">Gap: ${payload[0].value}M</p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="gap"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* Funding Concentrations & Contingency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funding Concentrations */}
        <ChartContainer
          title="Funding Concentrations"
          subtitle="Sources of funding by type"
        >
          <div className="space-y-3">
            {liquidity.fundingConcentrations.map((source) => (
              <div key={source.sourceName} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{source.sourceName}</span>
                    <span className="text-sm text-alm-text-muted">
                      ${(source.amount / 1_000_000_000).toFixed(1)}B
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-alm-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        source.riskLevel === 'low'
                          ? 'bg-alm-success'
                          : source.riskLevel === 'medium'
                          ? 'bg-alm-warning'
                          : 'bg-alm-danger'
                      )}
                      style={{ width: `${source.percentOfTotal}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {source.percentOfTotal}%
                </span>
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* Contingency Checklist */}
        <ChartContainer
          title="Contingency Readiness"
          subtitle="Liquidity stress preparedness"
        >
          <div className="space-y-2">
            {liquidity.contingencyReadiness.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    item.status === 'ready'
                      ? 'bg-alm-success/10'
                      : item.status === 'partial'
                      ? 'bg-alm-warning/10'
                      : 'bg-alm-danger/10'
                  )}
                >
                  {item.status === 'ready' ? (
                    <Check className="w-4 h-4 text-alm-success" />
                  ) : item.status === 'partial' ? (
                    <Clock className="w-4 h-4 text-alm-warning" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-alm-danger" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.item}</p>
                  {item.notes && (
                    <p className="text-xs text-alm-text-muted">{item.notes}</p>
                  )}
                </div>
                <span className="text-sm font-medium">{item.score}%</span>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}
