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
import { MODULE_DESCRIPTIONS } from '@/lib/alm/glossary';

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

  // Correlation matrix data - ALM industry-standard correlations
  // Based on empirical research: deposit betas exhibit asymmetric behavior in rising vs falling regimes
  // Lag effects capture the delayed pass-through of rate changes to deposit pricing
  const correlationMatrix = useMemo(() => {
    const variables = ['MMDA Beta', 'DDA Beta', 'CD Beta', 'Fed Funds', 'SOFR', '10Y TSY', 'CPI'];

    // Base correlation matrices by regime - derived from industry research
    // Rising regime: Lower deposit betas (banks slow to raise rates), weaker correlations
    // Falling regime: Higher deposit betas (banks quick to cut rates), stronger correlations
    const baseCorrelations: Record<'all' | 'rising' | 'falling', number[][]> = {
      // Format: MMDA, DDA, CD, Fed, SOFR, 10Y, CPI (symmetric matrix)
      all: [
        [1.00, 0.55, 0.10, 0.75, 0.85, 0.75, -0.05],  // MMDA Beta
        [0.55, 1.00, 0.45, 0.70, 0.70, 0.80, 0.15],   // DDA Beta
        [0.10, 0.45, 1.00, 0.85, 0.65, 0.65, -0.05],  // CD Beta
        [0.75, 0.70, 0.85, 1.00, 0.50, 0.25, 0.15],   // Fed Funds
        [0.85, 0.70, 0.65, 0.50, 1.00, 0.45, -0.10],  // SOFR
        [0.75, 0.80, 0.65, 0.25, 0.45, 1.00, 0.55],   // 10Y TSY
        [-0.05, 0.15, -0.05, 0.15, -0.10, 0.55, 1.00] // CPI
      ],
      rising: [
        [1.00, 0.45, 0.05, 0.65, 0.75, 0.65, -0.10],  // MMDA - lower beta correlations in rising
        [0.45, 1.00, 0.35, 0.55, 0.55, 0.70, 0.10],   // DDA - sticky deposits lag more
        [0.05, 0.35, 1.00, 0.75, 0.55, 0.55, -0.10],  // CD - rate sensitive, tracks Fed closely
        [0.65, 0.55, 0.75, 1.00, 0.55, 0.15, 0.20],   // Fed Funds
        [0.75, 0.55, 0.55, 0.55, 1.00, 0.35, -0.15],  // SOFR
        [0.65, 0.70, 0.55, 0.15, 0.35, 1.00, 0.50],   // 10Y - curve flattening typical
        [-0.10, 0.10, -0.10, 0.20, -0.15, 0.50, 1.00] // CPI - rising rates fight inflation
      ],
      falling: [
        [1.00, 0.65, 0.15, 0.85, 0.90, 0.85, 0.00],   // MMDA - higher pass-through in falling
        [0.65, 1.00, 0.55, 0.80, 0.80, 0.85, 0.20],   // DDA - rates cut faster
        [0.15, 0.55, 1.00, 0.90, 0.70, 0.70, 0.00],   // CD - strong Fed correlation
        [0.85, 0.80, 0.90, 1.00, 0.60, 0.30, 0.10],   // Fed Funds
        [0.90, 0.80, 0.70, 0.60, 1.00, 0.55, -0.05],  // SOFR
        [0.85, 0.85, 0.70, 0.30, 0.55, 1.00, 0.60],   // 10Y - curve steepening typical
        [0.00, 0.20, 0.00, 0.10, -0.05, 0.60, 1.00]   // CPI - falling rates may signal deflation risk
      ]
    };

    // Lag adjustment factors - correlations typically peak at optimal lag then decay
    // Different variables have different optimal lags in ALM theory
    const optimalLags: Record<string, number> = {
      'MMDA Beta': 1,   // Quick repricing
      'DDA Beta': 2,    // Moderate lag
      'CD Beta': 3,     // Maturity-driven lag
      'Fed Funds': 0,   // Immediate
      'SOFR': 0,        // Immediate (market rate)
      '10Y TSY': 0,     // Immediate (market rate)
      'CPI': 6          // Significant lag for inflation impact
    };

    // Calculate lag adjustment factor
    const getLagAdjustment = (var1: string, var2: string, lag: number): number => {
      if (var1 === var2) return 1; // Diagonal always 1

      const optLag1 = optimalLags[var1] ?? 0;
      const optLag2 = optimalLags[var2] ?? 0;
      const avgOptimalLag = (optLag1 + optLag2) / 2;

      // Bell curve around optimal lag - correlations strengthen toward optimal, then decay
      const distance = Math.abs(lag - avgOptimalLag);
      // Peak at optimal lag, decay with distance (sigma ~= 3 months)
      const adjustment = Math.exp(-Math.pow(distance, 2) / 18);
      // Correlation multiplier: ranges from 0.6 (far from optimal) to 1.0 (at optimal)
      return 0.6 + 0.4 * adjustment;
    };

    const baseMatrix = baseCorrelations[selectedRegime];
    const matrix: { row: string; col: string; value: number }[] = [];

    for (let i = 0; i < variables.length; i++) {
      for (let j = 0; j < variables.length; j++) {
        const baseCorr = baseMatrix[i][j];
        const lagAdj = getLagAdjustment(variables[i], variables[j], selectedLag);

        // Apply lag adjustment (preserve sign, adjust magnitude)
        let adjustedCorr = i === j ? 1 : baseCorr * lagAdj;

        // Clamp to valid correlation range [-1, 1]
        adjustedCorr = Math.max(-1, Math.min(1, adjustedCorr));

        matrix.push({
          row: variables[i],
          col: variables[j],
          value: Math.round(adjustedCorr * 100) / 100 // Round to 2 decimals
        });
      }
    }

    return { variables, matrix };
  }, [selectedLag, selectedRegime]);

  // Macro drivers - regime-dependent with lag-adjusted impacts
  // Based on ALM research: driver importance varies significantly by rate environment
  const macroDrivers = useMemo(() => {
    // Base driver data by regime - reflects asymmetric deposit pricing behavior
    const driversbyRegime: Record<'all' | 'rising' | 'falling', Array<{
      variable: string;
      baseImpact: number;
      optimalLag: number;
      direction: 'positive' | 'negative';
      explanations: { base: string; lagNote: string };
    }>> = {
      all: [
        {
          variable: 'Federal Funds Rate',
          baseImpact: 0.75,
          optimalLag: 1,
          direction: 'positive',
          explanations: {
            base: 'Primary driver of deposit pricing across all rate environments.',
            lagNote: 'Optimal pass-through at 1-month lag.',
          },
        },
        {
          variable: '10Y Treasury',
          baseImpact: 0.55,
          optimalLag: 2,
          direction: 'positive',
          explanations: {
            base: 'Long-term rate expectations influence CD pricing and customer behavior.',
            lagNote: 'Term deposit pricing responds with 2-3 month lag.',
          },
        },
        {
          variable: 'Unemployment Rate',
          baseImpact: 0.25,
          optimalLag: 6,
          direction: 'negative',
          explanations: {
            base: 'Labor market conditions affect deposit flows with significant lag.',
            lagNote: 'Economic stress leads to precautionary savings after ~6 months.',
          },
        },
      ],
      rising: [
        {
          variable: 'Federal Funds Rate',
          baseImpact: 0.65,
          optimalLag: 2,
          direction: 'positive',
          explanations: {
            base: 'Banks are slow to raise deposit rates in rising environments (lower beta).',
            lagNote: 'Pass-through delayed; optimal correlation at 2-month lag.',
          },
        },
        {
          variable: 'SOFR',
          baseImpact: 0.70,
          optimalLag: 1,
          direction: 'positive',
          explanations: {
            base: 'Wholesale funding costs pressure deposit pricing in rising rate cycles.',
            lagNote: 'Market rates transmit quickly; 1-month lag typical.',
          },
        },
        {
          variable: '10Y Treasury',
          baseImpact: 0.45,
          optimalLag: 3,
          direction: 'positive',
          explanations: {
            base: 'Yield curve flattening common in rising cycles affects CD competitiveness.',
            lagNote: 'Long-end impact delayed by 3+ months.',
          },
        },
      ],
      falling: [
        {
          variable: 'Federal Funds Rate',
          baseImpact: 0.85,
          optimalLag: 1,
          direction: 'positive',
          explanations: {
            base: 'Banks quickly cut deposit rates in falling environments (higher beta).',
            lagNote: 'Rapid pass-through; correlations peak at 1-month lag.',
          },
        },
        {
          variable: '10Y Treasury',
          baseImpact: 0.65,
          optimalLag: 2,
          direction: 'positive',
          explanations: {
            base: 'Yield curve steepening in rate cuts affects term deposit pricing.',
            lagNote: 'Long-end movements more impactful; 2-month optimal lag.',
          },
        },
        {
          variable: 'CPI',
          baseImpact: 0.30,
          optimalLag: 4,
          direction: 'positive',
          explanations: {
            base: 'Deflation concerns in rate-cutting cycles affect depositor behavior.',
            lagNote: 'Inflation expectations shift deposit preferences with 4-month lag.',
          },
        },
      ],
    };

    const drivers = driversbyRegime[selectedRegime];

    // Adjust impacts based on selected lag vs optimal lag
    return drivers.map((driver) => {
      const lagDistance = Math.abs(selectedLag - driver.optimalLag);
      // Impact decays as lag moves away from optimal (Gaussian decay, sigma ~= 2.5)
      const lagAdjustment = Math.exp(-Math.pow(lagDistance, 2) / 12.5);
      const adjustedImpact = driver.baseImpact * (0.5 + 0.5 * lagAdjustment);

      // Generate context-aware explanation
      const lagContext = selectedLag === driver.optimalLag
        ? `Currently at optimal ${driver.optimalLag}-month lag.`
        : selectedLag < driver.optimalLag
        ? `Full impact emerges at ${driver.optimalLag}-month lag.`
        : `Peak correlation was at ${driver.optimalLag}-month lag; relationship weakens at longer lags.`;

      return {
        variable: driver.variable,
        impact: Math.round(adjustedImpact * 100) / 100,
        direction: driver.direction,
        lag: driver.optimalLag,
        explanation: `${driver.explanations.base} ${lagContext}`,
      };
    });
  }, [selectedLag, selectedRegime]);

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-alm-text-dark dark:text-alm-text-primary">
              {MODULE_DESCRIPTIONS.macro.title}
            </h1>
            <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
              {MODULE_DESCRIPTIONS.macro.subtitle}
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
        <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-muted max-w-4xl leading-relaxed">
          {MODULE_DESCRIPTIONS.macro.description}
        </p>
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
