'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
import { Globe, TrendingUp, TrendingDown, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { ChartContainer } from '@/components/alm/charts/ChartContainer';
import { cn } from '@/lib/utils/cn';

interface FredData {
  latest: {
    fedFundsRate: number;
    treasury10Y: number;
    treasury2Y: number;
    treasury5Y: number;
    treasury30Y: number;
    yieldCurveSpread: number;
    unemploymentRate: number;
    mortgage30Y: number;
    primeRate: number;
    asOfDate: string;
  };
  series: Record<string, { date: string; value: number }[]>;
  mode: 'live' | 'demo';
}

export default function MacroPage() {
  const { isLoading, macroSeries } = useALM();
  const [selectedLag, setSelectedLag] = useState(0);
  const [selectedRegime, setSelectedRegime] = useState<'all' | 'rising' | 'falling'>('all');
  const [fredData, setFredData] = useState<FredData | null>(null);
  const [fredLoading, setFredLoading] = useState(false);
  const [fredError, setFredError] = useState<string | null>(null);

  // Fetch FRED data on mount
  useEffect(() => {
    fetchFredData();
  }, []);

  const fetchFredData = async () => {
    setFredLoading(true);
    setFredError(null);
    try {
      const response = await fetch('/api/alm/fred');
      const data = await response.json();
      if (data.success || data.latest) {
        setFredData({
          latest: data.latest,
          series: data.series,
          mode: data.mode || 'demo',
        });
      } else {
        setFredError(data.error || 'Failed to fetch FRED data');
      }
    } catch (error) {
      setFredError('Network error fetching FRED data');
      console.error('FRED fetch error:', error);
    } finally {
      setFredLoading(false);
    }
  };

  // Correlation matrix data
  const correlationMatrix = useMemo(() => {
    // Simplified correlation matrix
    const variables = ['MMDA Beta', 'DDA Beta', 'CD Beta', 'Fed Funds', 'SOFR', '10Y TSY', 'CPI'];
    const matrix: { row: string; col: string; value: number }[] = [];

    for (let i = 0; i < variables.length; i++) {
      for (let j = 0; j < variables.length; j++) {
        let correlation = 0;
        if (i === j) {
          correlation = 1;
        } else if ((i < 3 && j >= 3 && j < 6) || (j < 3 && i >= 3 && i < 6)) {
          correlation = 0.65 + Math.random() * 0.25;
        } else if (Math.abs(i - j) === 1) {
          correlation = 0.4 + Math.random() * 0.3;
        } else {
          correlation = Math.random() * 0.4 - 0.1;
        }
        matrix.push({ row: variables[i], col: variables[j], value: correlation });
      }
    }
    return { variables, matrix };
  }, []);

  // Macro drivers
  const macroDrivers = useMemo(() => {
    return [
      {
        variable: 'Federal Funds Rate',
        impact: 0.82,
        direction: 'positive' as const,
        lag: 1,
        explanation: 'Primary driver of deposit pricing. 1-month lag to full pass-through.',
      },
      {
        variable: '10Y Treasury',
        impact: 0.45,
        direction: 'positive' as const,
        lag: 3,
        explanation: 'Long-term rate expectations influence customer behavior and CD pricing.',
      },
      {
        variable: 'Unemployment Rate',
        impact: -0.28,
        direction: 'negative' as const,
        lag: 6,
        explanation: 'Higher unemployment leads to deposit growth as consumers save more.',
      },
    ];
  }, []);

  // Chart data for macro series - prefer FRED data if available
  const macroChartData = useMemo(() => {
    // Use FRED data if available
    if (fredData?.series?.FEDFUNDS && fredData.series.FEDFUNDS.length > 0) {
      return fredData.series.FEDFUNDS
        .slice(0, 24)
        .reverse()
        .map((point) => ({
          date: safeFormatDate(point.date, 'MMM yy'),
          fedFunds: point.value,
        }));
    }

    // Fall back to ALM context data
    if (!macroSeries || macroSeries.length === 0) return [];
    const fedFunds = macroSeries.find((s) => s.id === 'fed_funds');
    if (!fedFunds) return [];

    return fedFunds.points.slice(-24).map((point) => ({
      date: safeFormatDate(point.date, 'MMM yy'),
      fedFunds: point.value,
    }));
  }, [macroSeries, fredData]);

  // Treasury curve data from FRED
  const treasuryCurveData = useMemo(() => {
    if (!fredData?.latest) return null;
    return [
      { tenor: '3M', rate: fredData.series?.DGS3MO?.[0]?.value },
      { tenor: '2Y', rate: fredData.latest.treasury2Y },
      { tenor: '5Y', rate: fredData.latest.treasury5Y },
      { tenor: '10Y', rate: fredData.latest.treasury10Y },
      { tenor: '30Y', rate: fredData.latest.treasury30Y },
    ].filter(p => p.rate !== undefined);
  }, [fredData]);

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
            Macro Sensitivity - Regime & Lag Studio
          </h1>
          <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
            Analyze relationships between macro variables and deposit behavior
          </p>
        </div>
        <div className="flex items-center gap-3">
          {fredData && (
            <div className="flex items-center gap-2 text-sm">
              {fredData.mode === 'live' ? (
                <span className="badge-success flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  FRED Live
                </span>
              ) : (
                <span className="badge-warning flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  Demo Data
                </span>
              )}
              {fredData.latest?.asOfDate && (
                <span className="text-alm-text-muted text-xs">
                  As of {fredData.latest.asOfDate}
                </span>
              )}
            </div>
          )}
          <button
            onClick={fetchFredData}
            disabled={fredLoading}
            className="btn-secondary"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', fredLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Rates Panel */}
      {fredData?.latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Fed Funds', value: fredData.latest.fedFundsRate, suffix: '%' },
            { label: '2Y Treasury', value: fredData.latest.treasury2Y, suffix: '%' },
            { label: '10Y Treasury', value: fredData.latest.treasury10Y, suffix: '%' },
            { label: '30Y Treasury', value: fredData.latest.treasury30Y, suffix: '%' },
            { label: '2s10s Spread', value: fredData.latest.yieldCurveSpread, suffix: 'bp', multiplier: 100 },
            { label: 'Prime Rate', value: fredData.latest.primeRate, suffix: '%' },
            { label: '30Y Mortgage', value: fredData.latest.mortgage30Y, suffix: '%' },
            { label: 'Unemployment', value: fredData.latest.unemploymentRate, suffix: '%' },
          ].map((item) => (
            <div key={item.label} className="premium-card p-3">
              <p className="text-xs text-alm-text-muted truncate">{item.label}</p>
              <p className="text-lg font-bold">
                {item.value !== undefined
                  ? `${(item.multiplier ? item.value * item.multiplier : item.value).toFixed(2)}${item.suffix}`
                  : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-6 p-4 premium-card">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Lag (months):</label>
          <input
            type="range"
            min="0"
            max="12"
            value={selectedLag}
            onChange={(e) => setSelectedLag(Number(e.target.value))}
            className="w-32 accent-alm-accent"
          />
          <span className="text-sm font-mono w-8">{selectedLag}</span>
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-alm-border" />
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Regime:</label>
          {(['all', 'rising', 'falling'] as const).map((regime) => (
            <button
              key={regime}
              onClick={() => setSelectedRegime(regime)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors capitalize',
                selectedRegime === regime
                  ? 'bg-alm-accent text-white'
                  : 'text-alm-text-secondary hover:bg-slate-100 dark:hover:bg-alm-bg-tertiary'
              )}
            >
              {regime}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Correlation Matrix */}
        <ChartContainer
          title="Correlation Matrix"
          subtitle={`Lag: ${selectedLag} months | Regime: ${selectedRegime}`}
          tooltip="Shows correlations between macro variables and deposit betas. Darker colors indicate stronger relationships."
        >
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${correlationMatrix.variables.length}, 1fr)` }}>
                {/* Header row */}
                <div />
                {correlationMatrix.variables.map((v) => (
                  <div key={v} className="text-xxs text-alm-text-muted text-center truncate px-1">
                    {v}
                  </div>
                ))}
                {/* Data rows */}
                {correlationMatrix.variables.map((rowVar, rowIdx) => (
                  <>
                    <div key={`row-${rowVar}`} className="text-xs text-alm-text-muted text-right pr-2 truncate">
                      {rowVar}
                    </div>
                    {correlationMatrix.variables.map((colVar, colIdx) => {
                      const cell = correlationMatrix.matrix.find(
                        (c) => c.row === rowVar && c.col === colVar
                      );
                      const value = cell?.value || 0;
                      const intensity = Math.abs(value);
                      const isPositive = value >= 0;

                      return (
                        <motion.div
                          key={`${rowVar}-${colVar}`}
                          whileHover={{ scale: 1.1 }}
                          className={cn(
                            'aspect-square rounded flex items-center justify-center text-xxs font-medium cursor-pointer',
                            rowIdx === colIdx
                              ? 'bg-alm-accent text-white'
                              : isPositive
                              ? intensity > 0.6
                                ? 'bg-green-500/60 text-white'
                                : intensity > 0.3
                                ? 'bg-green-400/40'
                                : 'bg-green-300/20'
                              : intensity > 0.3
                              ? 'bg-red-400/40'
                              : 'bg-red-300/20'
                          )}
                          title={`${rowVar} vs ${colVar}: ${value.toFixed(2)}`}
                        >
                          {value.toFixed(1)}
                        </motion.div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>
        </ChartContainer>

        {/* Federal Funds Trend */}
        <ChartContainer
          title="Federal Funds Rate"
          subtitle="Historical trend - 24 months"
          tooltip="Federal Reserve policy rate, primary driver of short-term deposit pricing."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={macroChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-alm-border"
                />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.[0]) return null;
                    return (
                      <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                        <p className="text-xs text-alm-text-muted">{label}</p>
                        <p className="text-lg font-bold">{payload[0].value}%</p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="fedFunds"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* Top Macro Drivers */}
      <ChartContainer
        title="Top Macro Drivers"
        subtitle="Variables most predictive of deposit behavior"
        tooltip="Ranked by statistical significance and economic impact."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {macroDrivers.map((driver, idx) => (
            <motion.div
              key={driver.variable}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-alm-accent/10 flex items-center justify-center text-xs font-bold text-alm-accent">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-sm">{driver.variable}</span>
                </div>
                {driver.direction === 'positive' ? (
                  <TrendingUp className="w-4 h-4 text-alm-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-alm-danger" />
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold">{(driver.impact * 100).toFixed(0)}%</span>
                <span className="text-sm text-alm-text-muted">correlation</span>
              </div>
              <p className="text-xs text-alm-text-muted">{driver.explanation}</p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="badge-neutral">Lag: {driver.lag}mo</span>
              </div>
            </motion.div>
          ))}
        </div>
      </ChartContainer>
    </div>
  );
}
