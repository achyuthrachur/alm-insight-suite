'use client';

import { useState, useMemo } from 'react';
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
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Check,
  AlertTriangle,
  Plus,
  Sliders,
} from 'lucide-react';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { ChartContainer } from '@/components/alm/charts/ChartContainer';
import { cn } from '@/lib/utils/cn';

export default function HedgesPage() {
  const { isLoading, hedges, metrics } = useALM();
  const [selectedHedge, setSelectedHedge] = useState<string | null>(null);
  const [showStrategy, setShowStrategy] = useState(false);

  // Proposed hedge for strategy lab
  const [proposedNotional, setProposedNotional] = useState(100);

  const totalNotional = useMemo(() => {
    if (!hedges) return 0;
    return hedges.reduce((sum, h) => sum + h.notional, 0);
  }, [hedges]);

  const totalMTM = useMemo(() => {
    if (!hedges) return 0;
    return hedges.reduce((sum, h) => sum + h.marketValue, 0);
  }, [hedges]);

  const totalDV01 = useMemo(() => {
    if (!hedges) return 0;
    return hedges.reduce((sum, h) => sum + h.dv01, 0);
  }, [hedges]);

  if (isLoading || !hedges) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <div className="skeleton h-24 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
          <div className="skeleton h-24 rounded-xl" />
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
            Hedges & Strategy Lab
          </h1>
          <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
            Manage hedge inventory and analyze strategy options
          </p>
        </div>
        <button
          onClick={() => setShowStrategy(!showStrategy)}
          className={cn('btn-primary', showStrategy && 'bg-alm-accent-hover')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Strategy Lab
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-alm-accent/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-alm-accent" />
            </div>
            <div>
              <p className="text-sm text-alm-text-muted">Total Notional</p>
              <p className="text-2xl font-bold">${(totalNotional / 1_000_000).toFixed(0)}M</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                totalMTM >= 0 ? 'bg-alm-success/10' : 'bg-alm-danger/10'
              )}
            >
              {totalMTM >= 0 ? (
                <TrendingUp className="w-5 h-5 text-alm-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-alm-danger" />
              )}
            </div>
            <div>
              <p className="text-sm text-alm-text-muted">Total MTM</p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  totalMTM >= 0 ? 'text-alm-success' : 'text-alm-danger'
                )}
              >
                {totalMTM >= 0 ? '+' : ''}${(totalMTM / 1_000_000).toFixed(1)}M
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-alm-info/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-alm-info" />
            </div>
            <div>
              <p className="text-sm text-alm-text-muted">Portfolio DV01</p>
              <p className="text-2xl font-bold">${(totalDV01 / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Strategy Lab (Collapsible) */}
      {showStrategy && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="premium-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Sliders className="w-5 h-5 text-alm-accent" />
            <h3 className="font-semibold text-lg">Strategy Playground</h3>
            <span className="badge-warning">Hypothetical</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Proposed Pay-Fixed Swap Notional
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="25"
                  value={proposedNotional}
                  onChange={(e) => setProposedNotional(Number(e.target.value))}
                  className="flex-1 accent-alm-accent"
                />
                <span className="text-lg font-bold w-24">${proposedNotional}M</span>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary">
                <h4 className="text-sm font-medium mb-3">Projected Impact</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-alm-text-muted">NII Reduction (Up 200)</span>
                    <span className="text-sm font-medium text-alm-success">
                      +${(proposedNotional * 0.012).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-alm-text-muted">EVE Protection</span>
                    <span className="text-sm font-medium text-alm-success">
                      +${(proposedNotional * 0.035).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-alm-text-muted">DV01 Offset</span>
                    <span className="text-sm font-medium">
                      ${(proposedNotional * 0.85).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-alm-text-muted">Est. Annual Cost</span>
                    <span className="text-sm font-medium text-alm-danger">
                      -${(proposedNotional * 0.008).toFixed(2)}M
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border-2 border-dashed border-alm-border">
              <h4 className="text-sm font-medium mb-3">Limit Impact Preview</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>EVE +200bp Limit</span>
                    <span>
                      {Math.max(0, 78 - proposedNotional * 0.05).toFixed(0)}% →{' '}
                      <span className="text-alm-success">
                        {Math.max(0, 78 - proposedNotional * 0.08).toFixed(0)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-alm-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-alm-warning rounded-full transition-all"
                      style={{ width: `${Math.max(0, 78 - proposedNotional * 0.08)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>DV01 Limit</span>
                    <span>
                      63% →{' '}
                      <span className="text-alm-success">
                        {Math.max(0, 63 - proposedNotional * 0.04).toFixed(0)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-alm-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-alm-success rounded-full transition-all"
                      style={{ width: `${Math.max(0, 63 - proposedNotional * 0.04)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hedge Inventory */}
      <ChartContainer
        title="Hedge Inventory"
        subtitle={`${hedges.length} active positions`}
        tooltip="Current derivative hedge positions with effectiveness metrics"
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th className="text-right">Notional</th>
                <th className="text-right">MTM</th>
                <th className="text-right">DV01</th>
                <th>Maturity</th>
                <th>Effectiveness</th>
              </tr>
            </thead>
            <tbody>
              {hedges.map((hedge) => (
                <motion.tr
                  key={hedge.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary/50"
                  onClick={() => setSelectedHedge(hedge.id)}
                >
                  <td>
                    <p className="font-medium">{hedge.description}</p>
                    {hedge.counterparty && (
                      <p className="text-xs text-alm-text-muted">{hedge.counterparty}</p>
                    )}
                  </td>
                  <td>
                    <span className="badge-neutral capitalize">
                      {hedge.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-right tabular-nums">
                    ${(hedge.notional / 1_000_000).toFixed(0)}M
                  </td>
                  <td
                    className={cn(
                      'text-right tabular-nums font-medium',
                      hedge.marketValue >= 0 ? 'text-alm-success' : 'text-alm-danger'
                    )}
                  >
                    {hedge.marketValue >= 0 ? '+' : ''}$
                    {(hedge.marketValue / 1_000_000).toFixed(1)}M
                  </td>
                  <td className="text-right tabular-nums">
                    ${(hedge.dv01 / 1000).toFixed(0)}K
                  </td>
                  <td className="tabular-nums">
                    {safeFormatDate(hedge.maturityDate, 'MMM yyyy')}
                  </td>
                  <td>
                    {hedge.effectiveness ? (
                      <div className="flex items-center gap-2">
                        {hedge.effectiveness.effectivenessStatus === 'highly_effective' ? (
                          <Check className="w-4 h-4 text-alm-success" />
                        ) : hedge.effectiveness.effectivenessStatus === 'effective' ? (
                          <Check className="w-4 h-4 text-alm-warning" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-alm-danger" />
                        )}
                        <span className="text-sm capitalize">
                          {hedge.effectiveness.effectivenessStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-alm-text-muted">N/A</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>

      {/* Hedge Effectiveness Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['highly_effective', 'effective', 'ineffective'].map((status) => {
          const count = hedges.filter(
            (h) => h.effectiveness?.effectivenessStatus === status
          ).length;
          const config = {
            highly_effective: {
              label: 'Highly Effective',
              color: 'bg-alm-success/10 text-alm-success',
              icon: Check,
            },
            effective: {
              label: 'Effective',
              color: 'bg-alm-warning/10 text-alm-warning',
              icon: Check,
            },
            ineffective: {
              label: 'Ineffective',
              color: 'bg-alm-danger/10 text-alm-danger',
              icon: AlertTriangle,
            },
          }[status]!;
          const Icon = config.icon;

          return (
            <div key={status} className="premium-card p-4 flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', config.color)}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-alm-text-muted">{config.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
