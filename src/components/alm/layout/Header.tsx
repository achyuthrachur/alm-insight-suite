'use client';

import { useState } from 'react';
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
  Calendar,
  ChevronDown,
  Sun,
  Moon,
  Download,
  Database,
  RefreshCw,
  Bell,
  Settings,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils/cn';
import { useALM } from '../providers/ALMProvider';
import type { HorizonType } from '@/lib/alm/types';

const HORIZONS: { value: HorizonType; label: string }[] = [
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '12m', label: '12 Months' },
  { value: '24m', label: '24 Months' },
  { value: '36m', label: '36 Months' },
];

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const {
    currentRun,
    priorRun,
    scenarioSet,
    filters,
    setFilters,
    criticalAlerts,
    warningAlerts,
    refreshData,
    isLoading,
  } = useALM();

  const [showRunSelector, setShowRunSelector] = useState(false);
  const [showHorizonSelector, setShowHorizonSelector] = useState(false);
  const [showScenarioSelector, setShowScenarioSelector] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const alertCount = criticalAlerts.length + warningAlerts.length;

  return (
    <header className="h-16 bg-white dark:bg-alm-bg-secondary border-b border-slate-200 dark:border-alm-border flex items-center justify-between px-6">
      {/* Left: Run Info */}
      <div className="flex items-center gap-6">
        {/* Run Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRunSelector(!showRunSelector)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-alm-bg-tertiary transition-colors"
          >
            <Calendar className="w-4 h-4 text-alm-text-muted" />
            <div className="text-left">
              <p className="text-xs text-alm-text-dark-secondary dark:text-alm-text-muted">
                Current Run
              </p>
              <p className="text-sm font-medium text-alm-text-dark dark:text-alm-text-primary">
                {currentRun ? safeFormatDate(currentRun.timestamp, 'MMM d, yyyy') : 'Loading...'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-alm-text-muted" />
          </button>

          {showRunSelector && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowRunSelector(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg z-50 py-2">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-alm-border">
                  <p className="text-xs font-medium text-alm-text-muted uppercase">
                    Select Run
                  </p>
                </div>
                {currentRun && (
                  <button
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary flex items-center justify-between',
                      filters.runId === currentRun.runId && 'bg-alm-accent/10'
                    )}
                    onClick={() => {
                      setFilters({ runId: currentRun.runId });
                      setShowRunSelector(false);
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{currentRun.label}</p>
                      <p className="text-xs text-alm-text-muted">
                        {safeFormatDate(currentRun.timestamp, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <span className={filters.runId === currentRun.runId ? 'badge-success' : 'badge-neutral'}>
                      {filters.runId === currentRun.runId ? 'Active' : 'Current'}
                    </span>
                  </button>
                )}
                {priorRun && (
                  <button
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary flex items-center justify-between',
                      filters.runId === priorRun.runId && 'bg-alm-accent/10'
                    )}
                    onClick={() => {
                      setFilters({ runId: priorRun.runId });
                      setShowRunSelector(false);
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium">{priorRun.label}</p>
                      <p className="text-xs text-alm-text-muted">
                        {safeFormatDate(priorRun.timestamp, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <span className={filters.runId === priorRun.runId ? 'badge-success' : 'badge-neutral'}>
                      {filters.runId === priorRun.runId ? 'Active' : 'Prior'}
                    </span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-8 w-px bg-slate-200 dark:bg-alm-border" />

        {/* Scenario Selector */}
        <div className="relative">
          <button
            onClick={() => setShowScenarioSelector(!showScenarioSelector)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-alm-bg-tertiary transition-colors"
          >
            <div className="text-left">
              <p className="text-xs text-alm-text-dark-secondary dark:text-alm-text-muted">
                Scenarios
              </p>
              <p className="text-sm font-medium text-alm-text-dark dark:text-alm-text-primary">
                {filters.selectedScenarios.length} selected
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-alm-text-muted" />
          </button>

          {showScenarioSelector && scenarioSet && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowScenarioSelector(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg z-50 py-2 max-h-80 overflow-y-auto">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-alm-border">
                  <p className="text-xs font-medium text-alm-text-muted uppercase">
                    Select Scenarios
                  </p>
                </div>
                {scenarioSet.scenarios.map((scenario) => {
                  const isSelected = filters.selectedScenarios.includes(scenario.scenarioId);
                  return (
                    <button
                      key={scenario.scenarioId}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary flex items-center gap-3"
                      onClick={() => {
                        if (isSelected) {
                          setFilters({
                            selectedScenarios: filters.selectedScenarios.filter(
                              (s) => s !== scenario.scenarioId
                            ),
                          });
                        } else {
                          setFilters({
                            selectedScenarios: [...filters.selectedScenarios, scenario.scenarioId],
                          });
                        }
                      }}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-alm-accent border-alm-accent'
                            : 'border-slate-300 dark:border-alm-border'
                        )}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{scenario.name}</p>
                        <p className="text-xs text-alm-text-muted">{scenario.shortName}</p>
                      </div>
                      {scenario.isBase && <span className="badge-info">Base</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Horizon Selector */}
        <div className="relative">
          <button
            onClick={() => setShowHorizonSelector(!showHorizonSelector)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-alm-bg-tertiary transition-colors"
          >
            <div className="text-left">
              <p className="text-xs text-alm-text-dark-secondary dark:text-alm-text-muted">
                Horizon
              </p>
              <p className="text-sm font-medium text-alm-text-dark dark:text-alm-text-primary">
                {HORIZONS.find((h) => h.value === filters.horizon)?.label || '12 Months'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-alm-text-muted" />
          </button>

          {showHorizonSelector && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowHorizonSelector(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-alm-bg-secondary border border-slate-200 dark:border-alm-border rounded-lg shadow-lg z-50 py-2">
                {HORIZONS.map((horizon) => (
                  <button
                    key={horizon.value}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary',
                      filters.horizon === horizon.value && 'text-alm-accent font-medium'
                    )}
                    onClick={() => {
                      setFilters({ horizon: horizon.value });
                      setShowHorizonSelector(false);
                    }}
                  >
                    {horizon.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Refresh */}
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="btn-ghost"
          title="Refresh data"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </button>

        {/* View Data */}
        <button className="btn-ghost" title="View data">
          <Database className="w-4 h-4" />
        </button>

        {/* Export */}
        <button className="btn-ghost" title="Export">
          <Download className="w-4 h-4" />
        </button>

        {/* Alerts */}
        <button className="btn-ghost relative" title="Alerts">
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 w-4 h-4 rounded-full text-xxs font-medium flex items-center justify-center',
                criticalAlerts.length > 0 ? 'bg-alm-danger text-white' : 'bg-alm-warning text-white'
              )}
            >
              {alertCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="btn-ghost" title="Toggle theme">
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Settings */}
        <button className="btn-ghost" title="Settings">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
