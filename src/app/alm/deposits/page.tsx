'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
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
import { TrendingUp, TrendingDown, Activity, Sliders, Info } from 'lucide-react';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { ChartContainer } from '@/components/alm/charts/ChartContainer';
import { cn } from '@/lib/utils/cn';
import { MODULE_DESCRIPTIONS, CHART_EXPLANATIONS } from '@/lib/alm/glossary';

export default function DepositsPage() {
  const { isLoading, depositProducts, macroSeries } = useALM();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [betaAdjustment, setBetaAdjustment] = useState(0);
  const [decayAdjustment, setDecayAdjustment] = useState(0);

  // Product beta summary cards
  const betaSummary = useMemo(() => {
    if (!depositProducts) return [];

    return depositProducts.map((product) => ({
      id: product.productId,
      name: product.productName,
      type: product.productType,
      balance: product.balance,
      beta: product.beta.levelBeta,
      betaCI: product.beta.confidenceInterval,
      rSquared: product.beta.rSquared,
      stability: product.beta.stability,
      effectiveMaturity: product.effectiveMaturity,
      decayHalfLife: product.decay.halfLife,
    }));
  }, [depositProducts]);

  // Regression scatter data (deposit rate vs market rate)
  const regressionData = useMemo(() => {
    const selected = selectedProduct
      ? depositProducts?.find((p) => p.productId === selectedProduct)
      : depositProducts?.[0];
    if (!selected) return [];

    const fedFunds = macroSeries?.find((s) => s.id === 'fed_funds');
    if (!fedFunds) return [];

    return selected.observedRates.map((obs, idx) => {
      const marketRate = fedFunds.points[idx]?.value || 0;
      return {
        marketRate,
        depositRate: obs.rate * 100,
        date: obs.date,
      };
    });
  }, [selectedProduct, depositProducts, macroSeries]);

  // Time-varying beta chart data
  const betaTimeSeriesData = useMemo(() => {
    const selected = selectedProduct
      ? depositProducts?.find((p) => p.productId === selectedProduct)
      : depositProducts?.[0];
    if (!selected) return [];

    return selected.beta.timeVaryingBeta.map((beta, idx) => ({
      month: idx,
      beta: beta + betaAdjustment / 100,
      betaLower: Math.max(0, selected.beta.confidenceInterval.lower + betaAdjustment / 100),
      betaUpper: Math.min(1.5, selected.beta.confidenceInterval.upper + betaAdjustment / 100),
    }));
  }, [selectedProduct, depositProducts, betaAdjustment]);

  // Survival curve data
  const survivalData = useMemo(() => {
    const selected = selectedProduct
      ? depositProducts?.find((p) => p.productId === selectedProduct)
      : depositProducts?.[0];
    if (!selected) return [];

    return selected.decay.survivalCurve.map((point) => ({
      month: point.month,
      survival: point.survivalRate * 100 * (1 - decayAdjustment / 100),
      confidence: point.confidence ? point.confidence * 100 : null,
    }));
  }, [selectedProduct, depositProducts, decayAdjustment]);

  const selectedProductData = useMemo(() => {
    return selectedProduct
      ? depositProducts?.find((p) => p.productId === selectedProduct)
      : depositProducts?.[0];
  }, [selectedProduct, depositProducts]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
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
              {MODULE_DESCRIPTIONS.deposits.title}
            </h1>
            <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
              {MODULE_DESCRIPTIONS.deposits.subtitle}
            </p>
          </div>
        </div>
        <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-muted max-w-4xl leading-relaxed">
          {MODULE_DESCRIPTIONS.deposits.description}
        </p>
      </div>

      {/* Product Beta Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {betaSummary.map((product) => (
          <motion.button
            key={product.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedProduct(product.id)}
            className={cn(
              'premium-card p-4 text-left transition-all',
              selectedProduct === product.id || (!selectedProduct && product === betaSummary[0])
                ? 'ring-2 ring-alm-accent'
                : ''
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-alm-text-dark dark:text-alm-text-primary">
                  {product.name}
                </p>
                <p className="text-xs text-alm-text-muted">
                  ${(product.balance / 1_000_000_000).toFixed(1)}B
                </p>
              </div>
              <span
                className={cn(
                  'badge',
                  product.stability === 'stable'
                    ? 'badge-success'
                    : product.stability === 'moderate'
                    ? 'badge-warning'
                    : 'badge-danger'
                )}
              >
                {product.stability}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-alm-text-dark dark:text-alm-text-primary tabular-nums">
                {product.beta.toFixed(2)}
              </span>
              <span className="text-sm text-alm-text-muted">beta</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-alm-text-muted">
              <span>R² = {product.rSquared.toFixed(2)}</span>
              <span>Mat. = {product.effectiveMaturity.toFixed(0)}mo</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regression Scatter */}
        <ChartContainer
          title="Deposit Rate vs Market Rate"
          subtitle={selectedProductData ? `${selectedProductData.productName} regression analysis` : ''}
          tooltip="Each dot shows one month's deposit rate (Y-axis) vs the Fed Funds rate (X-axis). The slope of the best-fit line is the 'beta' - how much deposit rates move when market rates move. A beta of 0.5 means if the Fed raises rates 1%, deposit rates rise only 0.5%. Lower beta = more profit for the bank when rates rise. R² shows how reliable the beta estimate is (higher = more consistent behavior)."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-alm-border"
                />
                <XAxis
                  dataKey="marketRate"
                  type="number"
                  name="Market Rate"
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Market Rate (%)', position: 'bottom', fontSize: 12 }}
                />
                <YAxis
                  dataKey="depositRate"
                  type="number"
                  name="Deposit Rate"
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Deposit Rate (%)', angle: -90, position: 'left', fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                        <p className="text-xs text-alm-text-muted mb-1">
                          {safeFormatDate(data.date, 'MMM yyyy')}
                        </p>
                        <p className="text-sm">Market: {data.marketRate.toFixed(2)}%</p>
                        <p className="text-sm">Deposit: {data.depositRate.toFixed(2)}%</p>
                      </div>
                    );
                  }}
                />
                <Scatter name="Observations" data={regressionData} fill="#6366f1" />
                {/* Regression line would be calculated and added here */}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {selectedProductData && (
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-alm-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-alm-accent">
                  {selectedProductData.beta.levelBeta.toFixed(2)}
                </p>
                <p className="text-xs text-alm-text-muted">Level Beta</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {selectedProductData.beta.passThroughSlope.toFixed(2)}
                </p>
                <p className="text-xs text-alm-text-muted">Pass-Through</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {(selectedProductData.beta.rSquared * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-alm-text-muted">R-Squared</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-alm-text-dark dark:text-alm-text-primary">
                  [{selectedProductData.beta.confidenceInterval.lower.toFixed(2)} -{' '}
                  {selectedProductData.beta.confidenceInterval.upper.toFixed(2)}]
                </p>
                <p className="text-xs text-alm-text-muted">95% CI</p>
              </div>
            </div>
          )}
        </ChartContainer>

        {/* Time-Varying Beta */}
        <ChartContainer
          title="Time-Varying Beta"
          subtitle="Beta stability over time with confidence band"
          tooltip="This chart tracks how the deposit beta has changed over time. The line shows the estimated beta each month. The shaded area is the 'confidence band' - where we're 95% sure the true beta lies. A stable line with narrow bands means predictable deposit behavior. If the line jumps around or bands are wide, the deposit pricing is harder to predict."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={betaTimeSeriesData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-alm-border"
                />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => `${v}mo`}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v) => v.toFixed(1)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium">Month {data.month}</p>
                        <p className="text-sm">Beta: {data.beta.toFixed(3)}</p>
                        <p className="text-xs text-alm-text-muted">
                          CI: [{data.betaLower.toFixed(2)} - {data.betaUpper.toFixed(2)}]
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="betaUpper"
                  stackId="1"
                  stroke="transparent"
                  fill="#6366f1"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="betaLower"
                  stackId="2"
                  stroke="transparent"
                  fill="#ffffff"
                />
                <Line
                  type="monotone"
                  dataKey="beta"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <ReferenceLine
                  y={selectedProductData?.beta.levelBeta || 0.5}
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{ value: 'Avg', fontSize: 10 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>

      {/* Survival Curve & Sensitivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Survival/Decay Curve */}
        <div className="lg:col-span-2">
          <ChartContainer
            title="Deposit Survival Curve"
            subtitle="Decay profile and effective maturity"
            tooltip="This curve shows what percentage of today's deposits will still be at the bank over time. Deposits don't leave all at once - they 'decay' gradually as customers close accounts or move money. The 'half-life' (orange line) shows when 50% of deposits will have left. Longer half-life = more stable funding. 'Effective Maturity' is the average time deposits stay, used for ALM calculations."
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={survivalData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-alm-border"
                  />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v) => `${v}mo`}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium">Month {data.month}</p>
                          <p className="text-sm">Survival: {data.survival.toFixed(1)}%</p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="survival"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <ReferenceLine
                    y={50}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    label={{ value: 'Half-Life', fontSize: 10 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {selectedProductData && (
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-alm-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-alm-accent">
                    {selectedProductData.decay.halfLife.toFixed(0)}
                  </p>
                  <p className="text-xs text-alm-text-muted">Half-Life (mo)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {selectedProductData.effectiveMaturity.toFixed(0)}
                  </p>
                  <p className="text-xs text-alm-text-muted">Eff. Maturity (mo)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {(selectedProductData.decay.decayRate * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-alm-text-muted">Annual Decay</p>
                </div>
              </div>
            )}
          </ChartContainer>
        </div>

        {/* Sensitivity Sliders */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sliders className="w-5 h-5 text-alm-accent" />
            <h3 className="font-semibold text-alm-text-dark dark:text-alm-text-primary">
              Sensitivity Analysis
            </h3>
          </div>
          <p className="text-sm text-alm-text-muted mb-6">
            Adjust assumptions to see impact on risk metrics
          </p>

          {/* Beta Adjustment */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Beta Adjustment</label>
              <span className="text-sm font-mono text-alm-accent">
                {betaAdjustment > 0 ? '+' : ''}{betaAdjustment}%
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              value={betaAdjustment}
              onChange={(e) => setBetaAdjustment(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-alm-bg-tertiary rounded-lg appearance-none cursor-pointer accent-alm-accent"
            />
            <div className="flex justify-between text-xs text-alm-text-muted mt-1">
              <span>-20%</span>
              <span>+20%</span>
            </div>
          </div>

          {/* Decay Adjustment */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Decay Rate Adjustment</label>
              <span className="text-sm font-mono text-alm-accent">
                {decayAdjustment > 0 ? '+' : ''}{decayAdjustment}%
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              value={decayAdjustment}
              onChange={(e) => setDecayAdjustment(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-alm-bg-tertiary rounded-lg appearance-none cursor-pointer accent-alm-accent"
            />
            <div className="flex justify-between text-xs text-alm-text-muted mt-1">
              <span>-20%</span>
              <span>+20%</span>
            </div>
          </div>

          {/* Estimated Impact */}
          <div className="p-4 bg-slate-50 dark:bg-alm-bg-tertiary rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-alm-warning" />
              <span className="text-sm font-medium">Estimated Impact</span>
              <span className="badge-warning text-xxs">Hypothetical</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-alm-text-muted">NII Impact</span>
                <span
                  className={cn(
                    'font-medium',
                    betaAdjustment > 0 ? 'text-alm-danger' : 'text-alm-success'
                  )}
                >
                  {betaAdjustment > 0 ? '-' : '+'}$
                  {Math.abs(betaAdjustment * 0.5).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-alm-text-muted">EVE Impact</span>
                <span
                  className={cn(
                    'font-medium',
                    decayAdjustment < 0 ? 'text-alm-danger' : 'text-alm-success'
                  )}
                >
                  {decayAdjustment < 0 ? '-' : '+'}$
                  {Math.abs(decayAdjustment * 0.8).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setBetaAdjustment(0);
              setDecayAdjustment(0);
            }}
            className="w-full btn-secondary mt-4"
          >
            Reset to Baseline
          </button>
        </div>
      </div>
    </div>
  );
}
