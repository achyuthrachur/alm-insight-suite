'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { ChartContainer } from './ChartContainer';
import type { RiskMetrics, Scenario } from '@/lib/alm/types';

interface RiskSurfaceHeatmapProps {
  metrics: Record<string, RiskMetrics>;
  scenarios: Scenario[];
  metricType: 'nii' | 'eve';
  selectedScenarios?: string[];
  selectedHorizon?: string;
  onCellClick?: (scenarioId: string, horizon: string) => void;
  className?: string;
}

const ALL_HORIZONS = ['3m', '6m', '12m', '24m'];

export function RiskSurfaceHeatmap({
  metrics,
  scenarios,
  metricType,
  selectedScenarios,
  selectedHorizon,
  onCellClick,
  className,
}: RiskSurfaceHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ scenario: string; horizon: string } | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'nii' | 'eve'>(metricType);

  // Determine which horizons to show based on selected horizon
  const displayHorizons = useMemo(() => {
    if (!selectedHorizon) return ALL_HORIZONS;
    // Show horizons up to and including the selected horizon
    const horizonIndex = ALL_HORIZONS.indexOf(selectedHorizon);
    if (horizonIndex === -1) return ALL_HORIZONS;
    // Always show at least 3 horizons for context, centered on selected
    const minIndex = Math.max(0, horizonIndex - 1);
    const maxIndex = Math.min(ALL_HORIZONS.length - 1, horizonIndex + 2);
    return ALL_HORIZONS.slice(minIndex, maxIndex + 1);
  }, [selectedHorizon]);

  // Filter scenarios for display - use selected scenarios if provided, otherwise show all non-base
  const displayScenarios = useMemo(() => {
    const nonBaseScenarios = scenarios.filter((s) => !s.isBase);

    if (selectedScenarios && selectedScenarios.length > 0) {
      // Filter to only selected scenarios (excluding 'base' from visual filter)
      const selectedNonBase = nonBaseScenarios.filter(
        (s) => selectedScenarios.includes(s.scenarioId)
      );
      // If no non-base scenarios are selected, show all non-base
      return selectedNonBase.length > 0 ? selectedNonBase : nonBaseScenarios.slice(0, 7);
    }

    return nonBaseScenarios.slice(0, 7);
  }, [scenarios, selectedScenarios]);

  // Calculate cell values and color scale
  const cellData = useMemo(() => {
    const values: { scenario: string; horizon: string; value: number; label: string }[] = [];
    let minValue = Infinity;
    let maxValue = -Infinity;

    for (const scenario of displayScenarios) {
      const scenarioMetrics = metrics[scenario.scenarioId];
      if (!scenarioMetrics) continue;

      for (const horizon of displayHorizons) {
        const value =
          selectedMetric === 'nii'
            ? scenarioMetrics.nii.impactPercent
            : scenarioMetrics.eve.impactPercent;

        // Adjust value based on horizon (simplified - in reality would have separate metrics)
        const horizonMultiplier =
          horizon === '3m' ? 0.25 : horizon === '6m' ? 0.5 : horizon === '12m' ? 1 : 1.5;
        const adjustedValue = value * horizonMultiplier;

        values.push({
          scenario: scenario.scenarioId,
          horizon,
          value: adjustedValue,
          label: `${adjustedValue > 0 ? '+' : ''}${adjustedValue.toFixed(1)}%`,
        });

        minValue = Math.min(minValue, adjustedValue);
        maxValue = Math.max(maxValue, adjustedValue);
      }
    }

    return { values, minValue, maxValue };
  }, [displayScenarios, displayHorizons, metrics, selectedMetric]);

  // Color interpolation
  const getColor = (value: number): string => {
    const { minValue, maxValue } = cellData;
    const range = Math.max(Math.abs(minValue), Math.abs(maxValue));

    if (value === 0) return 'bg-slate-100 dark:bg-alm-bg-tertiary';

    if (value > 0) {
      const intensity = Math.min(value / range, 1);
      if (intensity < 0.25) return 'bg-green-100 dark:bg-green-900/30';
      if (intensity < 0.5) return 'bg-green-200 dark:bg-green-800/40';
      if (intensity < 0.75) return 'bg-green-300 dark:bg-green-700/50';
      return 'bg-green-400 dark:bg-green-600/60';
    } else {
      const intensity = Math.min(Math.abs(value) / range, 1);
      if (intensity < 0.25) return 'bg-red-100 dark:bg-red-900/30';
      if (intensity < 0.5) return 'bg-red-200 dark:bg-red-800/40';
      if (intensity < 0.75) return 'bg-red-300 dark:bg-red-700/50';
      return 'bg-red-400 dark:bg-red-600/60';
    }
  };

  const getTextColor = (value: number): string => {
    const { minValue, maxValue } = cellData;
    const range = Math.max(Math.abs(minValue), Math.abs(maxValue));
    const intensity = Math.min(Math.abs(value) / range, 1);

    if (intensity > 0.5) return 'text-white';
    return value > 0
      ? 'text-green-800 dark:text-green-200'
      : value < 0
      ? 'text-red-800 dark:text-red-200'
      : 'text-alm-text-dark dark:text-alm-text-primary';
  };

  return (
    <ChartContainer
      title="Risk Surface"
      subtitle={`${selectedMetric.toUpperCase()} Impact by Scenario & Horizon`}
      tooltip="Shows the sensitivity of income or value metrics across different rate scenarios and time horizons. Green indicates positive impact, red indicates negative."
      className={className}
      headerActions={
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={() => setSelectedMetric('nii')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              selectedMetric === 'nii'
                ? 'bg-alm-accent text-white'
                : 'text-alm-text-secondary hover:bg-slate-100 dark:hover:bg-alm-bg-tertiary'
            )}
          >
            NII
          </button>
          <button
            onClick={() => setSelectedMetric('eve')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded-md transition-colors',
              selectedMetric === 'eve'
                ? 'bg-alm-accent text-white'
                : 'text-alm-text-secondary hover:bg-slate-100 dark:hover:bg-alm-bg-tertiary'
            )}
          >
            EVE
          </button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-xs font-medium text-alm-text-muted">
                Scenario
              </th>
              {displayHorizons.map((horizon) => (
                <th
                  key={horizon}
                  className="text-center py-2 px-3 text-xs font-medium text-alm-text-muted uppercase"
                >
                  {horizon}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayScenarios.map((scenario, rowIdx) => (
              <tr key={scenario.scenarioId}>
                <td className="py-1 px-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-alm-text-dark dark:text-alm-text-primary">
                      {scenario.shortName}
                    </span>
                    <span className="text-xxs text-alm-text-muted">{scenario.name}</span>
                  </div>
                </td>
                {displayHorizons.map((horizon, colIdx) => {
                  const cell = cellData.values.find(
                    (v) => v.scenario === scenario.scenarioId && v.horizon === horizon
                  );
                  const isHovered =
                    hoveredCell?.scenario === scenario.scenarioId &&
                    hoveredCell?.horizon === horizon;

                  return (
                    <td key={horizon} className="py-1 px-1">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={cn(
                          'w-full h-12 rounded-lg flex items-center justify-center transition-all',
                          cell ? getColor(cell.value) : 'bg-slate-100 dark:bg-alm-bg-tertiary',
                          isHovered && 'ring-2 ring-alm-accent',
                          'cursor-pointer'
                        )}
                        onMouseEnter={() =>
                          setHoveredCell({ scenario: scenario.scenarioId, horizon })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => onCellClick?.(scenario.scenarioId, horizon)}
                      >
                        <span
                          className={cn(
                            'text-sm font-semibold tabular-nums',
                            cell ? getTextColor(cell.value) : 'text-alm-text-muted'
                          )}
                        >
                          {cell?.label || '-'}
                        </span>
                      </motion.button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-alm-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded bg-red-400 dark:bg-red-600/60" />
            <div className="w-4 h-4 rounded bg-red-300 dark:bg-red-700/50" />
            <div className="w-4 h-4 rounded bg-red-200 dark:bg-red-800/40" />
            <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30" />
          </div>
          <span className="text-xs text-alm-text-muted">Negative Impact</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-alm-text-muted">Positive Impact</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30" />
            <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-800/40" />
            <div className="w-4 h-4 rounded bg-green-300 dark:bg-green-700/50" />
            <div className="w-4 h-4 rounded bg-green-400 dark:bg-green-600/60" />
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}
