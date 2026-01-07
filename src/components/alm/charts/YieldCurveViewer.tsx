'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils/cn';
import { ChartContainer } from './ChartContainer';
import type { YieldCurve, Scenario } from '@/lib/alm/types';

interface YieldCurveViewerProps {
  curves: YieldCurve[];
  scenarios: Scenario[];
  selectedScenarios: string[];
  onScenarioToggle?: (scenarioId: string) => void;
  className?: string;
}

const SCENARIO_COLORS: Record<string, string> = {
  base: '#6366f1',
  up_100: '#22c55e',
  up_200: '#16a34a',
  down_100: '#ef4444',
  down_200: '#dc2626',
  steepener: '#f59e0b',
  flattener: '#8b5cf6',
  ramp_up: '#06b6d4',
};

export function YieldCurveViewer({
  curves,
  scenarios,
  selectedScenarios,
  onScenarioToggle,
  className,
}: YieldCurveViewerProps) {
  const [hoveredTenor, setHoveredTenor] = useState<number | null>(null);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    const baseCurve = curves.find((c) => c.scenarioId === 'base');
    if (!baseCurve) return [];

    return baseCurve.points.map((point) => {
      const dataPoint: Record<string, number | string> = {
        tenor: point.tenorLabel,
        tenorMonths: point.tenorMonths,
      };

      for (const curve of curves) {
        if (selectedScenarios.includes(curve.scenarioId)) {
          const curvePoint = curve.points.find((p) => p.tenorMonths === point.tenorMonths);
          if (curvePoint) {
            dataPoint[curve.scenarioId] = curvePoint.rate * 100; // Convert to percentage
          }
        }
      }

      return dataPoint;
    });
  }, [curves, selectedScenarios]);

  // Get scenarios for legend
  const displayScenarios = useMemo(() => {
    return scenarios.filter((s) => selectedScenarios.includes(s.scenarioId));
  }, [scenarios, selectedScenarios]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-semibold text-sm text-alm-text-dark dark:text-alm-text-primary mb-2">
          {label} Tenor
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            const scenario = scenarios.find((s) => s.scenarioId === entry.dataKey);
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-alm-text-secondary">
                    {scenario?.shortName || entry.dataKey}
                  </span>
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {entry.value.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <ChartContainer
      title="Yield Curves"
      subtitle="Treasury spot rates by scenario"
      tooltip="Displays the term structure of interest rates across different scenarios. Click on legend items to toggle visibility."
      className={className}
    >
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-slate-200 dark:text-alm-border"
            />
            <XAxis
              dataKey="tenor"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'currentColor' }}
              className="text-alm-text-muted"
            />
            <YAxis
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'currentColor' }}
              className="text-alm-text-muted"
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                const scenario = scenarios.find((s) => s.scenarioId === value);
                return (
                  <span className="text-sm text-alm-text-dark dark:text-alm-text-primary">
                    {scenario?.shortName || value}
                  </span>
                );
              }}
            />
            {displayScenarios.map((scenario) => (
              <Line
                key={scenario.scenarioId}
                type="monotone"
                dataKey={scenario.scenarioId}
                name={scenario.scenarioId}
                stroke={SCENARIO_COLORS[scenario.scenarioId] || '#94a3b8'}
                strokeWidth={scenario.isBase ? 3 : 2}
                strokeDasharray={scenario.isBase ? undefined : '5 5'}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario Quick Toggle */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-alm-border">
        {scenarios.slice(0, 8).map((scenario) => {
          const isSelected = selectedScenarios.includes(scenario.scenarioId);
          return (
            <button
              key={scenario.scenarioId}
              onClick={() => onScenarioToggle?.(scenario.scenarioId)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                isSelected
                  ? 'text-white'
                  : 'text-alm-text-secondary bg-slate-100 dark:bg-alm-bg-tertiary hover:bg-slate-200 dark:hover:bg-alm-bg-elevated'
              )}
              style={{
                backgroundColor: isSelected
                  ? SCENARIO_COLORS[scenario.scenarioId] || '#94a3b8'
                  : undefined,
              }}
            >
              {scenario.shortName}
            </button>
          );
        })}
      </div>
    </ChartContainer>
  );
}
