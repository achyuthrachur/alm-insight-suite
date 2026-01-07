'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  FileCheck,
  Clock,
  User,
  Check,
  X,
  AlertTriangle,
  GitCompare,
  Download,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Activity,
  Layers,
  History,
  Target,
} from 'lucide-react';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { ChartContainer } from '@/components/alm/charts/ChartContainer';
import { cn } from '@/lib/utils/cn';

// Safe date formatting helper to handle Date objects and ISO strings
const safeFormatDate = (date: Date | string, formatStr: string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    return format(dateObj, formatStr);
  } catch {
    return 'N/A';
  }
};

type TabType = 'deposit_betas' | 'loan_assumptions' | 'repricing' | 'basis_risk' | 'summary';

export default function AssumptionsPage() {
  const { isLoading, assumptionSets, assumptionLibrary } = useALM();
  const [activeTab, setActiveTab] = useState<TabType>('deposit_betas');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [selectedDepositProduct, setSelectedDepositProduct] = useState<string | null>(null);
  const [selectedLoanProduct, setSelectedLoanProduct] = useState<string | null>(null);

  const selectedSet = useMemo(() => {
    if (!assumptionSets || assumptionSets.length === 0) return null;
    return selectedSetId
      ? assumptionSets.find((s) => s.id === selectedSetId)
      : assumptionSets[0];
  }, [assumptionSets, selectedSetId]);

  // Calculate summary metrics from assumption library
  const summaryMetrics = useMemo(() => {
    if (!assumptionLibrary) {
      return {
        avgDepositBeta: 0.52,
        avgLoanBeta: 0.68,
        avgPrepaymentCPR: 8.5,
        betaAdjustedGap: -125000000,
      };
    }
    return {
      avgDepositBeta: assumptionLibrary.summaryMetrics.avgDepositBeta,
      avgLoanBeta: assumptionLibrary.summaryMetrics.avgLoanBeta,
      avgPrepaymentCPR: assumptionLibrary.summaryMetrics.avgLoanPrepayment,
      betaAdjustedGap: assumptionLibrary.summaryMetrics.totalBetaAdjustedGap,
    };
  }, [assumptionLibrary]);

  // Format deposit beta data for comparison chart
  const depositBetaChartData = useMemo(() => {
    if (!assumptionLibrary?.depositBetas) return [];
    return assumptionLibrary.depositBetas.map((beta) => ({
      name: beta.productName.split(' ')[0],
      levelBeta: beta.levelBeta,
      upBeta: beta.upBeta,
      downBeta: beta.downBeta,
      peerAvg: beta.peerBetaAvg || beta.levelBeta * 0.95,
    }));
  }, [assumptionLibrary]);

  // Format historical beta data for selected product
  const historicalBetaData = useMemo(() => {
    if (!assumptionLibrary?.depositBetas) return [];

    const product = selectedDepositProduct
      ? assumptionLibrary.depositBetas.find((p) => p.productId === selectedDepositProduct)
      : assumptionLibrary.depositBetas[0];

    if (!product?.historicalBeta) return [];

    return product.historicalBeta.slice(0, 24).reverse().map((point) => ({
      date: safeFormatDate(point.date, 'MMM yy'),
      beta: point.value,
      marketRate: point.marketRate,
      productRate: point.productRate,
    }));
  }, [assumptionLibrary, selectedDepositProduct]);

  // Loan prepayment chart data
  const loanPrepaymentData = useMemo(() => {
    if (!assumptionLibrary?.loanAssumptions) return [];
    return assumptionLibrary.loanAssumptions.map((loan) => ({
      name: loan.productName.split(' ').slice(0, 2).join(' '),
      baseCPR: loan.prepayment.baselineCPR,
      stressCPR: loan.prepayment.incentiveCPR,
      seasonality: loan.prepayment.seasonalityAdjustment[0] || 1,
    }));
  }, [assumptionLibrary]);

  // Loan credit assumptions chart data
  const loanCreditData = useMemo(() => {
    if (!assumptionLibrary?.loanAssumptions) return [];
    return assumptionLibrary.loanAssumptions.map((loan) => ({
      name: loan.productName.split(' ').slice(0, 2).join(' '),
      pd: loan.creditAssumptions.pdRate,
      lgd: loan.creditAssumptions.lgdRate,
      el: loan.creditAssumptions.expectedLossRate * 100,
    }));
  }, [assumptionLibrary]);

  // Basis risk chart data
  const basisRiskData = useMemo(() => {
    if (!assumptionLibrary?.basisRisks) return [];
    return assumptionLibrary.basisRisks.map((basis) => ({
      name: `${basis.indexPair.index1} vs ${basis.indexPair.index2}`,
      avgSpread: basis.currentSpread,
      volatility: basis.volatility,
      stressSpread: basis.stressSpread,
    }));
  }, [assumptionLibrary]);

  const tabs: { id: TabType; label: string; icon: typeof Percent }[] = [
    { id: 'deposit_betas', label: 'Deposit Betas', icon: Percent },
    { id: 'loan_assumptions', label: 'Loan Assumptions', icon: DollarSign },
    { id: 'repricing', label: 'Repricing', icon: Activity },
    { id: 'basis_risk', label: 'Basis Risk', icon: Layers },
    { id: 'summary', label: 'Summary', icon: History },
  ];

  const statusConfig = {
    draft: { color: 'badge-neutral', icon: Clock, label: 'Draft' },
    review: { color: 'badge-warning', icon: AlertTriangle, label: 'In Review' },
    approved: { color: 'badge-success', icon: Check, label: 'Approved' },
    archived: { color: 'badge-neutral', icon: X, label: 'Archived' },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alm-text-dark dark:text-alm-text-primary">
            ALM Assumptions Library
          </h1>
          <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
            Deposit betas, loan assumptions, repricing, and historical tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className={cn('btn-secondary', showDiff && 'bg-alm-accent/10 border-alm-accent')}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Versions
          </button>
          <button className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Export Pack
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="premium-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Percent className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm text-alm-text-muted">Avg Deposit Beta</span>
          </div>
          <p className="text-2xl font-bold">{(summaryMetrics.avgDepositBeta * 100).toFixed(1)}%</p>
          <p className="text-xs text-alm-text-muted mt-1">Weighted by balance</p>
        </div>
        <div className="premium-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm text-alm-text-muted">Avg Loan Beta</span>
          </div>
          <p className="text-2xl font-bold">{(summaryMetrics.avgLoanBeta * 100).toFixed(1)}%</p>
          <p className="text-xs text-alm-text-muted mt-1">Floating rate loans</p>
        </div>
        <div className="premium-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-sm text-alm-text-muted">Avg Prepayment CPR</span>
          </div>
          <p className="text-2xl font-bold">{summaryMetrics.avgPrepaymentCPR.toFixed(1)}%</p>
          <p className="text-xs text-alm-text-muted mt-1">Annualized rate</p>
        </div>
        <div className="premium-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-sm text-alm-text-muted">Beta-Adjusted Gap</span>
          </div>
          <p className="text-2xl font-bold">
            ${(summaryMetrics.betaAdjustedGap / 1000000).toFixed(0)}M
          </p>
          <p className="text-xs text-alm-text-muted mt-1">12-month horizon</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-alm-bg-tertiary rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-white dark:bg-alm-bg-secondary text-alm-accent shadow-sm'
                : 'text-alm-text-muted hover:text-alm-text-dark dark:hover:text-alm-text-primary'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'deposit_betas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposit Beta Comparison */}
          <ChartContainer
            title="Deposit Beta Comparison"
            subtitle="Level, Up, and Down betas by product"
            tooltip="Compares deposit pricing sensitivity across products. Up/Down betas show asymmetric behavior."
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={depositBetaChartData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-alm-border"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    domain={[0, 1]}
                  />
                  <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
                              {p.name}: {(p.value * 100).toFixed(1)}%
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="levelBeta" name="Level Beta" fill="#6366f1" radius={2} />
                  <Bar dataKey="upBeta" name="Up Beta" fill="#22c55e" radius={2} />
                  <Bar dataKey="downBeta" name="Down Beta" fill="#ef4444" radius={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>

          {/* Historical Beta Trend */}
          <ChartContainer
            title="Historical Beta Trend"
            subtitle="24-month beta evolution"
            tooltip="Shows how deposit beta has changed over time, along with market and product rates."
          >
            <div className="mb-3">
              <select
                value={selectedDepositProduct || ''}
                onChange={(e) => setSelectedDepositProduct(e.target.value || null)}
                className="text-sm border border-slate-200 dark:border-alm-border rounded-md px-3 py-1.5 bg-white dark:bg-alm-bg-tertiary"
              >
                {assumptionLibrary?.depositBetas?.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalBetaData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-alm-border"
                  />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="beta"
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    domain={[0, 1]}
                    orientation="left"
                  />
                  <YAxis
                    yAxisId="rate"
                    tickFormatter={(v) => `${v.toFixed(1)}%`}
                    orientation="right"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
                              {p.name}: {p.dataKey === 'beta' ? `${(p.value * 100).toFixed(1)}%` : `${p.value.toFixed(2)}%`}
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="beta"
                    type="monotone"
                    dataKey="beta"
                    name="Beta"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="marketRate"
                    name="Market Rate"
                    stroke="#94a3b8"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    yAxisId="rate"
                    type="monotone"
                    dataKey="productRate"
                    name="Product Rate"
                    stroke="#22c55e"
                    strokeWidth={1}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>

          {/* Deposit Beta Details Table */}
          <div className="lg:col-span-2 premium-card">
            <div className="p-4 border-b border-slate-100 dark:border-alm-border">
              <h3 className="font-semibold">Deposit Beta Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-alm-bg-tertiary">
                  <tr>
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-right p-3 font-medium">Balance</th>
                    <th className="text-right p-3 font-medium">Level Beta</th>
                    <th className="text-right p-3 font-medium">Up Beta</th>
                    <th className="text-right p-3 font-medium">Down Beta</th>
                    <th className="text-right p-3 font-medium">Asymmetry</th>
                    <th className="text-right p-3 font-medium">Lag (mo)</th>
                    <th className="text-right p-3 font-medium">R-Squared</th>
                    <th className="text-center p-3 font-medium">Stability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-alm-border">
                  {assumptionLibrary?.depositBetas?.map((beta) => (
                    <tr
                      key={beta.productId}
                      className="hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary"
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{beta.productName}</p>
                          <p className="text-xs text-alm-text-muted">{beta.segment}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        ${(beta.balance / 1000000).toFixed(0)}M
                      </td>
                      <td className="p-3 text-right tabular-nums font-medium">
                        {(beta.levelBeta * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-right tabular-nums text-alm-success">
                        {(beta.upBeta * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-right tabular-nums text-alm-danger">
                        {(beta.downBeta * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {beta.asymmetryRatio.toFixed(2)}x
                      </td>
                      <td className="p-3 text-right tabular-nums">{beta.lagMonths}</td>
                      <td className="p-3 text-right tabular-nums">
                        {(beta.rSquared * 100).toFixed(0)}%
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            beta.stability === 'stable'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : beta.stability === 'moderate'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {beta.stability}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'loan_assumptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prepayment Chart */}
          <ChartContainer
            title="Prepayment Assumptions (CPR)"
            subtitle="Base and stress prepayment rates by product"
            tooltip="Conditional Prepayment Rate assumptions used in cashflow modeling."
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loanPrepaymentData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-alm-border"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
                              {p.name}: {p.value.toFixed(1)}%
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="baseCPR" name="Base CPR" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stressCPR" name="Stress CPR" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>

          {/* Credit Assumptions Chart */}
          <ChartContainer
            title="Credit Assumptions"
            subtitle="PD, LGD, and Expected Loss by product"
            tooltip="Credit loss assumptions for loan portfolio modeling."
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loanCreditData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-alm-border"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
                              {p.name}: {p.value.toFixed(2)}%
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="pd" name="PD" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lgd" name="LGD" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="el" name="Expected Loss" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>

          {/* Loan Assumptions Table */}
          <div className="lg:col-span-2 premium-card">
            <div className="p-4 border-b border-slate-100 dark:border-alm-border">
              <h3 className="font-semibold">Loan Assumption Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-alm-bg-tertiary">
                  <tr>
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-right p-3 font-medium">Balance</th>
                    <th className="text-right p-3 font-medium">Base CPR</th>
                    <th className="text-right p-3 font-medium">Stress CPR</th>
                    <th className="text-right p-3 font-medium">Pricing Beta</th>
                    <th className="text-right p-3 font-medium">Index</th>
                    <th className="text-right p-3 font-medium">PD</th>
                    <th className="text-right p-3 font-medium">LGD</th>
                    <th className="text-right p-3 font-medium">Repricing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-alm-border">
                  {assumptionLibrary?.loanAssumptions?.map((loan) => (
                    <tr
                      key={loan.productId}
                      className="hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary"
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{loan.productName}</p>
                          <p className="text-xs text-alm-text-muted">{loan.productType}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        ${(loan.balance / 1000000).toFixed(0)}M
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {loan.prepayment.baselineCPR.toFixed(1)}%
                      </td>
                      <td className="p-3 text-right tabular-nums text-alm-warning">
                        {loan.prepayment.incentiveCPR.toFixed(1)}%
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {(loan.pricingBeta.levelBeta * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-right text-xs">{loan.pricingBeta.indexType}</td>
                      <td className="p-3 text-right tabular-nums text-alm-danger">
                        {(loan.creditAssumptions.pdRate * 100).toFixed(2)}%
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {(loan.creditAssumptions.lgdRate * 100).toFixed(0)}%
                      </td>
                      <td className="p-3 text-right text-xs">
                        {loan.repricingAssumptions.repricingFrequency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'repricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Repricing Summary */}
          <ChartContainer
            title="Floating Rate Loan Repricing"
            subtitle="Index lag and spread assumptions"
            tooltip="Repricing assumptions for floating rate loan products."
          >
            <div className="space-y-4 p-2">
              {assumptionLibrary?.loanAssumptions
                ?.filter((l) => l.repricingAssumptions.repricingFrequency !== 'at_maturity')
                .map((loan) => (
                  <div
                    key={loan.productId}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{loan.productName}</span>
                      <span className="badge-neutral">{loan.repricingAssumptions.repricingFrequency}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-alm-text-muted">Index</p>
                        <p className="font-medium">{loan.pricingBeta.indexType}</p>
                      </div>
                      <div>
                        <p className="text-alm-text-muted">Lag</p>
                        <p className="font-medium">{loan.repricingAssumptions.indexLag} days</p>
                      </div>
                      <div>
                        <p className="text-alm-text-muted">Spread</p>
                        <p className="font-medium">
                          {(loan.repricingAssumptions.basisSpread * 100).toFixed(0)} bps
                        </p>
                      </div>
                      <div>
                        <p className="text-alm-text-muted">Floor</p>
                        <p className="font-medium">
                          {loan.pricingBeta.floor
                            ? `${(loan.pricingBeta.floor * 100).toFixed(2)}%`
                            : 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </ChartContainer>

          {/* Deposit Repricing Behavior */}
          <ChartContainer
            title="Deposit Repricing Behavior"
            subtitle="Lag distribution and pass-through"
            tooltip="Shows how deposit rates respond to market rate changes over time."
          >
            <div className="space-y-4 p-2">
              {assumptionLibrary?.depositBetas?.slice(0, 4).map((deposit) => (
                <div
                  key={deposit.productId}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{deposit.productName}</span>
                    <span className="text-sm text-alm-text-muted">
                      Lag: {deposit.lagMonths} months
                    </span>
                  </div>
                  <div className="flex gap-1 h-6">
                    {deposit.lagDistribution.map((pct, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-alm-accent rounded"
                        style={{ opacity: pct }}
                        title={`Month ${i + 1}: ${(pct * 100).toFixed(0)}% pass-through`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-alm-text-muted">
                    <span>Month 1</span>
                    <span>Month {deposit.lagDistribution.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </ChartContainer>
        </div>
      )}

      {activeTab === 'basis_risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basis Risk Chart */}
          <ChartContainer
            title="Basis Risk Exposure"
            subtitle="Index spread assumptions"
            tooltip="Shows basis risk between different rate indices used in pricing."
          >
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={basisRiskData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-alm-border"
                  />
                  <XAxis type="number" tickFormatter={(v) => `${v} bps`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
                              {p.name}: {p.value.toFixed(1)} bps
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avgSpread" name="Avg Spread" fill="#6366f1" radius={2} />
                  <Bar dataKey="volatility" name="Volatility" fill="#f59e0b" radius={2} />
                  <Bar dataKey="stressSpread" name="Stress Spread" fill="#ef4444" radius={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>

          {/* Basis Risk Details */}
          <ChartContainer
            title="Basis Risk Parameters"
            subtitle="Detailed assumptions by index pair"
            tooltip="Parameters used for basis risk modeling."
          >
            <div className="space-y-4 p-2">
              {assumptionLibrary?.basisRisks?.map((basis) => (
                <div
                  key={`${basis.indexPair.index1}-${basis.indexPair.index2}`}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">
                      {basis.indexPair.index1} vs {basis.indexPair.index2}
                    </span>
                    <span className="text-sm text-alm-accent font-medium">
                      {(basis.correlation * 100).toFixed(0)}% correlated
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-alm-text-muted">Avg Spread</p>
                      <p className="font-medium">{(basis.currentSpread * 100).toFixed(1)} bps</p>
                    </div>
                    <div>
                      <p className="text-alm-text-muted">Volatility</p>
                      <p className="font-medium">{(basis.volatility * 100).toFixed(1)} bps</p>
                    </div>
                    <div>
                      <p className="text-alm-text-muted">Stress</p>
                      <p className="font-medium text-alm-danger">
                        {(basis.stressSpread * 100).toFixed(1)} bps
                      </p>
                    </div>
                    <div>
                      <p className="text-alm-text-muted">Exposure</p>
                      <p className="font-medium">${(basis.exposureAmount / 1000000).toFixed(0)}M</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartContainer>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assumption Sets List */}
          <div className="premium-card">
            <div className="p-4 border-b border-slate-100 dark:border-alm-border">
              <h3 className="font-semibold">Assumption Sets</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-alm-border">
              {assumptionSets?.map((set) => {
                const config = statusConfig[set.status];
                const isSelected = selectedSet?.id === set.id;

                return (
                  <motion.button
                    key={set.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelectedSetId(set.id)}
                    className={cn(
                      'w-full p-4 text-left transition-colors',
                      isSelected
                        ? 'bg-alm-accent/5 border-l-2 border-alm-accent'
                        : 'hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{set.name}</p>
                        <p className="text-xs text-alm-text-muted">v{set.version}</p>
                      </div>
                      <span className={config.color}>{config.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-alm-text-muted">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {set.owner}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(set.updatedAt), 'MMM d')}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Assumption Change History */}
          <div className="lg:col-span-2 premium-card">
            <div className="p-4 border-b border-slate-100 dark:border-alm-border">
              <h3 className="font-semibold">Assumption Change History</h3>
              <p className="text-sm text-alm-text-muted">Audit trail of parameter changes</p>
            </div>
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {assumptionLibrary?.assumptionHistory?.slice(0, 20).map((change, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary flex items-start gap-3"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      change.priorValue !== undefined && Math.abs(change.value - change.priorValue) / change.priorValue > 0.1
                        ? 'bg-alm-warning/10 text-alm-warning'
                        : 'bg-alm-success/10 text-alm-success'
                    )}
                  >
                    <History className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{change.parameterLabel}</span>
                      <span className="text-xs text-alm-text-muted">({change.category})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-alm-text-muted line-through">
                        {typeof change.priorValue === 'number'
                          ? change.priorValue.toFixed(2)
                          : change.priorValue ?? '-'}
                      </span>
                      <TrendingUp className="w-3 h-3 text-alm-text-muted" />
                      <span className="text-sm font-medium">
                        {typeof change.value === 'number'
                          ? change.value.toFixed(2)
                          : change.value}
                      </span>
                    </div>
                    {change.changeReason && (
                      <p className="text-xs text-alm-text-muted mt-1">{change.changeReason}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-alm-text-muted flex-shrink-0">
                    <p>{safeFormatDate(change.asOfDate, 'MMM d, yyyy')}</p>
                    <p>{change.approvedBy || 'System'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
