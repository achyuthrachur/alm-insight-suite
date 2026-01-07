'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Percent,
  DollarSign,
  Droplets,
  AlertTriangle,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { KPICard } from '@/components/alm/cards/KPICard';
import { AlertsFeed } from '@/components/alm/cards/AlertsFeed';
import { RiskSurfaceHeatmap } from '@/components/alm/charts/RiskSurfaceHeatmap';
import { cn } from '@/lib/utils/cn';

export default function ALMOverviewPage() {
  const {
    isLoading,
    currentRun,
    priorRun,
    scenarioSet,
    metrics,
    unresolvedAlerts,
    liquidity,
    positions,
    filters,
  } = useALM();

  // Calculate key metrics
  const kpiData = useMemo(() => {
    if (!metrics || !scenarioSet) return null;

    const baseMetrics = metrics['base'];
    const upMetrics = metrics['up_200'];
    const downMetrics = metrics['down_200'];

    if (!baseMetrics) return null;

    // NII at 12 months under base case
    const nii12m = baseMetrics.nii.projectedNII;
    const niiChange = upMetrics ? upMetrics.nii.impactPercent : 0;

    // EVE under +200bp shock
    const eveImpact = upMetrics ? upMetrics.eve.impactPercent : 0;

    // Duration of Equity
    const doe = baseMetrics.duration.equityDuration;

    // NIM
    const nim = baseMetrics.nii.nim;

    // DV01
    const dv01 = baseMetrics.duration.dv01;

    // Breaches count
    const breachCount = baseMetrics.limits.filter((l) => l.status === 'breach').length;
    const warningCount = baseMetrics.limits.filter((l) => l.status === 'warning').length;

    return {
      nii12m,
      niiChange,
      eveImpact,
      doe,
      nim,
      dv01,
      breachCount,
      warningCount,
    };
  }, [metrics, scenarioSet]);

  // Calculate what changed vs prior
  const changes = useMemo(() => {
    if (!kpiData) return [];

    return [
      {
        label: 'NII Sensitivity improved',
        detail: 'Reduced exposure by 45 bps',
        impact: 'positive',
        module: 'scenarios',
      },
      {
        label: 'MMDA Beta increased',
        detail: 'From 0.60 to 0.65 (+8%)',
        impact: 'negative',
        module: 'deposits',
      },
      {
        label: 'New hedge added',
        detail: '$200M pay-fixed swap',
        impact: 'positive',
        module: 'hedges',
      },
      {
        label: 'EVE limit utilization up',
        detail: 'Now at 78% of limit',
        impact: 'warning',
        module: 'scenarios',
      },
    ];
  }, [kpiData]);

  // Top drivers
  const topDrivers = useMemo(() => {
    return [
      {
        rank: 1,
        driver: 'Deposit Beta Assumptions',
        impact: -12500000,
        direction: 'negative' as const,
        module: 'assumptions',
      },
      {
        rank: 2,
        driver: 'Loan Prepayment Speeds',
        impact: 8200000,
        direction: 'positive' as const,
        module: 'assumptions',
      },
      {
        rank: 3,
        driver: 'MBS Duration Extension',
        impact: -5100000,
        direction: 'negative' as const,
        module: 'scenarios',
      },
      {
        rank: 4,
        driver: 'New Hedge Effectiveness',
        impact: 4800000,
        direction: 'positive' as const,
        module: 'hedges',
      },
    ];
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* KPI Strip Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <KPICard key={i} title="" value="" loading />
          ))}
        </div>
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton h-96 rounded-xl" />
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
            ALCO Flight Deck
          </h1>
          <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
            Asset-Liability Management Overview •{' '}
            {currentRun ? format(new Date(currentRun.timestamp), 'MMMM d, yyyy') : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge-success">DEMO MODE</span>
          {currentRun && (
            <span className="text-sm text-alm-text-muted">
              Data Quality: {currentRun.dataQualityScore}%
            </span>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KPICard
          title="NII @ 12M"
          value={kpiData ? `$${(kpiData.nii12m / 1_000_000).toFixed(0)}` : '-'}
          unit="M"
          delta={2.3}
          trend="up"
          status="good"
          tooltip="Net Interest Income projection over 12 months under base scenario"
          onClick={() => {}}
        />
        <KPICard
          title="EVE +200bp"
          value={kpiData ? `${kpiData.eveImpact.toFixed(1)}` : '-'}
          unit="%"
          delta={-0.8}
          trend="down"
          status={kpiData && Math.abs(kpiData.eveImpact) > 12 ? 'bad' : 'warning'}
          tooltip="Economic Value of Equity sensitivity under +200bp parallel shock"
        />
        <KPICard
          title="DOE"
          value={kpiData ? kpiData.doe.toFixed(1) : '-'}
          unit="yrs"
          trend="flat"
          status={kpiData && kpiData.doe > 8 ? 'warning' : 'good'}
          tooltip="Duration of Equity - interest rate sensitivity measure"
        />
        <KPICard
          title="NIM"
          value={kpiData ? kpiData.nim.toFixed(2) : '-'}
          unit="%"
          delta={0.05}
          trend="up"
          status="good"
          tooltip="Net Interest Margin"
        />
        <KPICard
          title="DV01"
          value={kpiData ? `$${(kpiData.dv01 / 1000).toFixed(0)}` : '-'}
          unit="K"
          trend="flat"
          status="neutral"
          tooltip="Dollar Value of 1 basis point - P&L impact per bp rate change"
        />
        <KPICard
          title="Liquidity"
          value={liquidity ? liquidity.survivalHorizon : '-'}
          unit="days"
          delta={5}
          trend="up"
          status={liquidity && liquidity.survivalHorizon >= liquidity.survivalHorizonTarget ? 'good' : 'warning'}
          tooltip="Liquidity survival horizon under stress"
        />
        <KPICard
          title="Alerts"
          value={kpiData ? kpiData.breachCount + kpiData.warningCount : '-'}
          status={kpiData && kpiData.breachCount > 0 ? 'bad' : kpiData && kpiData.warningCount > 0 ? 'warning' : 'good'}
          tooltip="Active limit breaches and warnings"
          onClick={() => {}}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Surface Heatmap */}
        <div className="lg:col-span-2">
          {scenarioSet && metrics && (
            <RiskSurfaceHeatmap
              scenarios={scenarioSet.scenarios}
              metrics={metrics}
              metricType="nii"
              onCellClick={(scenario, horizon) => {
                console.log('Clicked:', scenario, horizon);
              }}
            />
          )}
        </div>

        {/* Alerts Feed */}
        <div>
          <AlertsFeed
            alerts={unresolvedAlerts}
            maxItems={5}
            onAlertClick={(alert) => console.log('Alert clicked:', alert)}
            onViewAll={() => console.log('View all alerts')}
          />
        </div>
      </div>

      {/* What Changed & Top Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What Changed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-alm-text-dark dark:text-alm-text-primary">
              What Changed vs Prior Run
            </h3>
            <Link
              href="/alm/scenarios"
              className="text-sm text-alm-accent hover:text-alm-accent-hover flex items-center gap-1"
            >
              Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {changes.map((change, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary/50"
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    change.impact === 'positive' && 'bg-alm-success',
                    change.impact === 'negative' && 'bg-alm-danger',
                    change.impact === 'warning' && 'bg-alm-warning'
                  )}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-alm-text-dark dark:text-alm-text-primary">
                    {change.label}
                  </p>
                  <p className="text-xs text-alm-text-muted">{change.detail}</p>
                </div>
                <Link
                  href={`/alm/${change.module}`}
                  className="btn-ghost p-1.5"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Drivers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-alm-text-dark dark:text-alm-text-primary">
              Top Risk Drivers
            </h3>
            <span className="text-xs text-alm-text-muted">Impact on NII</span>
          </div>
          <div className="space-y-3">
            {topDrivers.map((driver) => (
              <div
                key={driver.rank}
                className="flex items-center gap-4"
              >
                <span className="w-6 h-6 rounded-full bg-alm-bg-tertiary dark:bg-alm-bg-elevated flex items-center justify-center text-xs font-medium text-alm-text-muted">
                  {driver.rank}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-alm-text-dark dark:text-alm-text-primary">
                    {driver.driver}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      driver.direction === 'positive' ? 'text-alm-success' : 'text-alm-danger'
                    )}
                  >
                    {driver.direction === 'positive' ? '+' : ''}
                    ${(driver.impact / 1_000_000).toFixed(1)}M
                  </span>
                  {driver.direction === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-alm-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-alm-danger" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Scenario Explorer', href: '/alm/scenarios', icon: BarChart3 },
          { label: 'Deposit Behavior', href: '/alm/deposits', icon: Percent },
          { label: 'Assumptions', href: '/alm/assumptions', icon: Target },
          { label: 'AI Report', href: '/alm/report', icon: Activity },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="premium-card p-4 flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-alm-accent/10 flex items-center justify-center group-hover:bg-alm-accent/20 transition-colors">
              <link.icon className="w-5 h-5 text-alm-accent" />
            </div>
            <span className="font-medium text-alm-text-dark dark:text-alm-text-primary group-hover:text-alm-accent transition-colors">
              {link.label}
            </span>
            <ArrowRight className="w-4 h-4 text-alm-text-muted ml-auto group-hover:text-alm-accent group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  );
}
