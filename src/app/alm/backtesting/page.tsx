'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

// Safe date formatting helper to handle Date objects and ISO strings
const safeFormatDate = (date: Date | string | undefined | null, formatStr: string): string => {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    return format(dateObj, formatStr);
  } catch {
    return 'N/A';
  }
};
import { FlaskConical, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { ChartContainer } from '@/components/alm/charts/ChartContainer';
import { cn } from '@/lib/utils/cn';
import { MODULE_DESCRIPTIONS } from '@/lib/alm/glossary';

export default function BacktestingPage() {
  const { isLoading, backtests } = useALM();

  const niiBacktest = useMemo(() => {
    return backtests?.find((b) => b.metricType === 'NII');
  }, [backtests]);

  const betaBacktest = useMemo(() => {
    return backtests?.find((b) => b.metricType === 'BETA');
  }, [backtests]);

  // Prepare NII chart data
  const niiChartData = useMemo(() => {
    if (!niiBacktest) return [];
    return niiBacktest.forecasts.map((f, idx) => ({
      date: safeFormatDate(f.date, 'MMM yy'),
      forecast: f.value / 1_000_000,
      realized: niiBacktest.realized[idx]?.value / 1_000_000 || null,
    }));
  }, [niiBacktest]);

  // Prepare Beta chart data
  const betaChartData = useMemo(() => {
    if (!betaBacktest) return [];
    return betaBacktest.forecasts.map((f, idx) => ({
      date: safeFormatDate(f.date, 'MMM yy'),
      forecast: f.value,
      realized: betaBacktest.realized[idx]?.value || null,
    }));
  }, [betaBacktest]);

  if (isLoading || !backtests) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-2 gap-6">
          <div className="skeleton h-96 rounded-xl" />
          <div className="skeleton h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-alm-text-dark dark:text-alm-text-primary">
              {MODULE_DESCRIPTIONS.backtesting.title}
            </h1>
            <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
              {MODULE_DESCRIPTIONS.backtesting.subtitle}
            </p>
          </div>
        </div>
        <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-muted max-w-4xl leading-relaxed">
          {MODULE_DESCRIPTIONS.backtesting.description}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: 'NII RMSE',
            value: niiBacktest ? `$${(niiBacktest.errorMetrics.rootMeanSquareError / 1_000_000).toFixed(1)}M` : '-',
            status: 'good',
            icon: CheckCircle,
          },
          {
            label: 'NII Bias',
            value: niiBacktest ? `${niiBacktest.errorMetrics.bias > 0 ? '+' : ''}${niiBacktest.errorMetrics.bias.toFixed(1)}%` : '-',
            status: Math.abs(niiBacktest?.errorMetrics.bias || 0) < 1 ? 'good' : 'warning',
            icon: Math.abs(niiBacktest?.errorMetrics.bias || 0) < 1 ? CheckCircle : AlertTriangle,
          },
          {
            label: 'Beta MAPE',
            value: betaBacktest ? `${betaBacktest.errorMetrics.meanPercentageError.toFixed(1)}%` : '-',
            status: Math.abs(betaBacktest?.errorMetrics.meanPercentageError || 0) < 5 ? 'good' : 'warning',
            icon: CheckCircle,
          },
          {
            label: 'Drift Signals',
            value: betaBacktest?.driftSignals.length || 0,
            status: (betaBacktest?.driftSignals.length || 0) === 0 ? 'good' : 'warning',
            icon: (betaBacktest?.driftSignals.length || 0) === 0 ? CheckCircle : AlertTriangle,
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="premium-card p-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    card.status === 'good' ? 'bg-alm-success/10' : 'bg-alm-warning/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      card.status === 'good' ? 'text-alm-success' : 'text-alm-warning'
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm text-alm-text-muted">{card.label}</p>
                  <p className="text-xl font-bold">{card.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NII Forecast vs Realized */}
        <ChartContainer
          title="NII: Forecast vs Realized"
          subtitle="12-month lookback"
          tooltip="Compares NII projections against actual results. Closer lines indicate better model performance."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={niiChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-alm-border"
                />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `$${v}M`}
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    return (
                      <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                        <p className="text-xs text-alm-text-muted mb-2">{label}</p>
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex justify-between gap-4 text-sm">
                            <span style={{ color: entry.color }}>{entry.name}</span>
                            <span className="font-medium">${entry.value?.toFixed(1)}M</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="realized"
                  name="Realized"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {niiBacktest && (
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-alm-border">
              <div className="text-center">
                <p className="text-lg font-bold">${(niiBacktest.errorMetrics.meanAbsoluteError / 1_000_000).toFixed(1)}M</p>
                <p className="text-xs text-alm-text-muted">MAE</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">${(niiBacktest.errorMetrics.rootMeanSquareError / 1_000_000).toFixed(1)}M</p>
                <p className="text-xs text-alm-text-muted">RMSE</p>
              </div>
              <div className="text-center">
                <p className={cn('text-lg font-bold', niiBacktest.errorMetrics.bias > 0 ? 'text-alm-success' : 'text-alm-danger')}>
                  {niiBacktest.errorMetrics.bias > 0 ? '+' : ''}{niiBacktest.errorMetrics.bias.toFixed(2)}%
                </p>
                <p className="text-xs text-alm-text-muted">Bias</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold capitalize">{niiBacktest.errorMetrics.stability}</p>
                <p className="text-xs text-alm-text-muted">Stability</p>
              </div>
            </div>
          )}
        </ChartContainer>

        {/* Beta Forecast vs Realized */}
        <ChartContainer
          title="Deposit Beta: Forecast vs Realized"
          subtitle="MMDA Retail product"
          tooltip="Compares assumed deposit beta against observed beta from rate pass-through analysis."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={betaChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-alm-border"
                />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v) => v.toFixed(1)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    return (
                      <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                        <p className="text-xs text-alm-text-muted mb-2">{label}</p>
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex justify-between gap-4 text-sm">
                            <span style={{ color: entry.color }}>{entry.name}</span>
                            <span className="font-medium">{entry.value?.toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Assumed"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="realized"
                  name="Realized"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* Drift Signals */}
      {betaBacktest && betaBacktest.driftSignals.length > 0 && (
        <ChartContainer
          title="Model Drift Signals"
          subtitle="Detected anomalies requiring attention"
        >
          <div className="space-y-3">
            {betaBacktest.driftSignals.map((signal) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'p-4 rounded-lg border-l-4',
                  signal.significance === 'high'
                    ? 'bg-alm-danger/5 border-alm-danger'
                    : signal.significance === 'moderate'
                    ? 'bg-alm-warning/5 border-alm-warning'
                    : 'bg-alm-info/5 border-alm-info'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle
                        className={cn(
                          'w-4 h-4',
                          signal.significance === 'high'
                            ? 'text-alm-danger'
                            : signal.significance === 'moderate'
                            ? 'text-alm-warning'
                            : 'text-alm-info'
                        )}
                      />
                      <span className="font-medium capitalize">
                        {signal.driftType.replace(/_/g, ' ')} - {signal.metric}
                      </span>
                      {signal.product && (
                        <span className="badge-neutral">{signal.product}</span>
                      )}
                    </div>
                    <p className="text-sm text-alm-text-muted">{signal.recommendation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Magnitude: {signal.magnitude.toFixed(2)}</p>
                    <p className="text-xs text-alm-text-muted">
                      {safeFormatDate(signal.detectedAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ChartContainer>
      )}
    </div>
  );
}
