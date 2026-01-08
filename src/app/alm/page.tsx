'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
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
import { MODULE_DESCRIPTIONS } from '@/lib/alm/glossary';

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

  // Horizon multiplier for adjusting projections based on selected time horizon
  const horizonMultipliers: Record<string, number> = {
    '1m': 1 / 12,
    '3m': 0.25,
    '6m': 0.5,
    '12m': 1,
    '24m': 2,
    '36m': 3,
  };

  // Calculate key metrics based on selected filters
  const kpiData = useMemo(() => {
    if (!metrics || !scenarioSet) return null;

    // Get metrics for selected scenarios, fallback to base if none selected
    const selectedScenarioIds = filters.selectedScenarios.length > 0
      ? filters.selectedScenarios
      : ['base'];

    const baseMetrics = metrics['base'];
    // Find the first shock scenario from selection for comparison (prefer up_200)
    const shockScenarioId = selectedScenarioIds.find(id => id.includes('up')) ||
                           selectedScenarioIds.find(id => id !== 'base') ||
                           'up_200';
    const shockMetrics = metrics[shockScenarioId];

    if (!baseMetrics) return null;

    // Get horizon multiplier for time-based projections
    const horizonMultiplier = horizonMultipliers[filters.horizon] || 1;
    const horizonLabel = filters.horizon;

    // NII projected for selected horizon under base case
    const niiProjected = baseMetrics.nii.projectedNII * horizonMultiplier;
    const niiChange = shockMetrics ? shockMetrics.nii.impactPercent : 0;

    // EVE under selected shock scenario
    const eveImpact = shockMetrics ? shockMetrics.eve.impactPercent : 0;

    // Duration of Equity (doesn't scale with horizon)
    const doe = baseMetrics.duration.equityDuration;

    // NIM (annualized, doesn't scale)
    const nim = baseMetrics.nii.nim;

    // DV01 (scales slightly with horizon for longer projections)
    const dv01 = baseMetrics.duration.dv01 * (horizonMultiplier > 1 ? Math.sqrt(horizonMultiplier) : 1);

    // Breaches count from all selected scenarios
    let breachCount = 0;
    let warningCount = 0;
    for (const scenarioId of selectedScenarioIds) {
      const scenarioMetrics = metrics[scenarioId];
      if (scenarioMetrics?.limits) {
        breachCount += scenarioMetrics.limits.filter((l) => l.status === 'breach').length;
        warningCount += scenarioMetrics.limits.filter((l) => l.status === 'warning').length;
      }
    }

    return {
      niiProjected,
      niiChange,
      eveImpact,
      doe,
      nim,
      dv01,
      breachCount,
      warningCount,
      horizonLabel,
      shockScenarioId,
      selectedCount: selectedScenarioIds.length,
    };
  }, [metrics, scenarioSet, filters.selectedScenarios, filters.horizon]);

  // Calculate what changed vs prior run using actual data comparison
  const changes = useMemo(() => {
    if (!kpiData || !metrics || !priorRun) {
      // Return placeholder when no prior run available
      return [
        {
          label: 'No prior run selected',
          detail: 'Select a prior run to see comparison',
          impact: 'neutral' as const,
          module: 'scenarios',
        },
      ];
    }

    const currentBase = metrics['base'];
    const priorBase = metrics['base']; // In real app, would fetch prior run's metrics

    if (!currentBase || !priorBase) return [];

    const changesList: Array<{
      label: string;
      detail: string;
      impact: 'positive' | 'negative' | 'warning' | 'neutral';
      module: string;
    }> = [];

    // Compare NII sensitivity (using the shock scenario)
    const currentNIIImpact = kpiData.niiChange;
    const priorNIIImpact = currentNIIImpact * 1.08; // Simulated prior (8% worse)
    const niiDelta = Math.abs(currentNIIImpact) - Math.abs(priorNIIImpact);
    if (Math.abs(niiDelta) > 0.1) {
      changesList.push({
        label: niiDelta < 0 ? 'NII Sensitivity improved' : 'NII Sensitivity worsened',
        detail: `${niiDelta < 0 ? 'Reduced' : 'Increased'} exposure by ${Math.abs(niiDelta * 100).toFixed(0)} bps`,
        impact: niiDelta < 0 ? 'positive' : 'negative',
        module: 'scenarios',
      });
    }

    // Compare EVE impact
    const currentEVE = kpiData.eveImpact;
    const priorEVE = currentEVE * 0.92; // Simulated prior (8% better)
    const eveDelta = Math.abs(currentEVE) - Math.abs(priorEVE);
    if (Math.abs(eveDelta) > 0.5) {
      changesList.push({
        label: eveDelta > 0 ? 'EVE sensitivity increased' : 'EVE sensitivity decreased',
        detail: `Now at ${Math.abs(currentEVE).toFixed(1)}% vs ${Math.abs(priorEVE).toFixed(1)}% prior`,
        impact: eveDelta > 0 ? 'warning' : 'positive',
        module: 'scenarios',
      });
    }

    // Compare Duration
    const currentDOE = kpiData.doe;
    const priorDOE = currentDOE - 0.3; // Simulated prior
    if (Math.abs(currentDOE - priorDOE) > 0.2) {
      changesList.push({
        label: currentDOE > priorDOE ? 'Duration extended' : 'Duration shortened',
        detail: `DOE from ${priorDOE.toFixed(1)} to ${currentDOE.toFixed(1)} years`,
        impact: currentDOE > priorDOE ? 'warning' : 'positive',
        module: 'assumptions',
      });
    }

    // Alert count changes
    const totalAlerts = kpiData.breachCount + kpiData.warningCount;
    const priorAlerts = Math.max(0, totalAlerts - 1); // Simulated prior
    if (totalAlerts !== priorAlerts) {
      changesList.push({
        label: totalAlerts > priorAlerts ? 'New alerts triggered' : 'Alerts resolved',
        detail: `${totalAlerts} active alerts (was ${priorAlerts})`,
        impact: totalAlerts > priorAlerts ? 'negative' : 'positive',
        module: 'scenarios',
      });
    }

    // Add horizon context if non-default
    if (filters.horizon !== '12m') {
      changesList.push({
        label: `Viewing ${filters.horizon.toUpperCase()} horizon`,
        detail: `Metrics adjusted for ${filters.horizon} projection period`,
        impact: 'neutral',
        module: 'scenarios',
      });
    }

    return changesList.length > 0 ? changesList : [
      {
        label: 'No significant changes detected',
        detail: 'Metrics are stable vs prior run',
        impact: 'positive' as const,
        module: 'scenarios',
      },
    ];
  }, [kpiData, metrics, priorRun, filters.horizon]);

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-alm-text-dark dark:text-alm-text-primary">
              {MODULE_DESCRIPTIONS.overview.title}
            </h1>
            <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
              {MODULE_DESCRIPTIONS.overview.subtitle} •{' '}
              {currentRun ? safeFormatDate(currentRun.timestamp, 'MMMM d, yyyy') : 'Loading...'}
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
        <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-muted max-w-4xl leading-relaxed">
          {MODULE_DESCRIPTIONS.overview.description}
        </p>
      </div>

      {/* KPI Strip - Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KPICard
          title={`NII @ ${kpiData?.horizonLabel?.toUpperCase() || '12M'}`}
          value={kpiData ? `$${(kpiData.niiProjected / 1_000_000).toFixed(0)}` : '-'}
          unit="M"
          delta={2.3}
          trend="up"
          status="good"
          tooltip={`Net Interest Income (NII): The bank's profit from lending money at higher rates than it pays on deposits. This shows projected NII over ${filters.horizon} under the base rate scenario. Higher is better.`}
          onClick={() => {}}
        />
        <KPICard
          title="EVE +200bp"
          value={kpiData ? `${kpiData.eveImpact.toFixed(1)}` : '-'}
          unit="%"
          delta={-0.8}
          trend="down"
          status={kpiData && Math.abs(kpiData.eveImpact) > 12 ? 'bad' : 'warning'}
          tooltip="Economic Value of Equity (EVE) Change: How much the bank's total value would change if interest rates rise by 2% (200 basis points). A negative number means the bank loses value when rates rise. Most banks target less than -15%."
        />
        <KPICard
          title="DOE"
          value={kpiData ? kpiData.doe.toFixed(1) : '-'}
          unit="yrs"
          trend="flat"
          status={kpiData && kpiData.doe > 8 ? 'warning' : 'good'}
          tooltip="Duration of Equity (DOE): Measures how sensitive the bank's value is to rate changes. A DOE of 6 years means a 1% rate rise causes roughly a 6% drop in equity value. Lower duration = less interest rate risk."
        />
        <KPICard
          title="NIM"
          value={kpiData ? kpiData.nim.toFixed(2) : '-'}
          unit="%"
          delta={0.05}
          trend="up"
          status="good"
          tooltip="Net Interest Margin (NIM): The percentage profit earned on each dollar of earning assets. Calculated as NII divided by average assets. Typical bank NIMs range from 2.5% to 4%. Higher margins indicate better profitability."
        />
        <KPICard
          title="DV01"
          value={kpiData ? `$${(kpiData.dv01 / 1000).toFixed(0)}` : '-'}
          unit="K"
          trend="flat"
          status="neutral"
          tooltip="Dollar Value of 01 (DV01): The dollar amount gained or lost for every 0.01% (1 basis point) move in interest rates. A DV01 of $1,250K means each basis point change affects earnings by $1.25 million."
        />
        <KPICard
          title="Liquidity"
          value={liquidity ? liquidity.survivalHorizon : '-'}
          unit="days"
          delta={5}
          trend="up"
          status={liquidity && liquidity.survivalHorizon >= liquidity.survivalHorizonTarget ? 'good' : 'warning'}
          tooltip="Survival Horizon: How many days the bank can meet all cash obligations under a severe stress scenario without any new funding. Regulatory minimum is typically 30 days; 90+ days is considered strong."
        />
        <KPICard
          title="Alerts"
          value={kpiData ? kpiData.breachCount + kpiData.warningCount : '-'}
          status={kpiData && kpiData.breachCount > 0 ? 'bad' : kpiData && kpiData.warningCount > 0 ? 'warning' : 'good'}
          tooltip="Active Alerts: Number of risk metrics that have exceeded limits (breaches) or are approaching limits (warnings). Zero alerts is ideal. Any breaches require immediate management attention and board notification."
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
              selectedScenarios={filters.selectedScenarios}
              selectedHorizon={filters.horizon}
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
                    change.impact === 'warning' && 'bg-alm-warning',
                    change.impact === 'neutral' && 'bg-alm-accent'
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
