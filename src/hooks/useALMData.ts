'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getALMDemoData, resetALMDemoData } from '@/lib/alm/data';
import type {
  Run,
  ScenarioSet,
  Scenario,
  YieldCurve,
  Position,
  RiskMetrics,
  DepositProduct,
  MacroSeries,
  AssumptionSet,
  Alert,
  LiquidityMetrics,
  Hedge,
  BacktestResult,
  HorizonType,
  GlobalFilters,
  AssumptionLibrary,
} from '@/lib/alm/types';

interface ALMDataState {
  isLoading: boolean;
  error: Error | null;
  currentRun: Run | null;
  priorRun: Run | null;
  scenarioSet: ScenarioSet | null;
  curves: YieldCurve[];
  positions: Position[];
  metrics: Record<string, RiskMetrics>;
  depositProducts: DepositProduct[];
  macroSeries: MacroSeries[];
  assumptionSets: AssumptionSet[];
  alerts: Alert[];
  liquidity: LiquidityMetrics | null;
  hedges: Hedge[];
  backtests: BacktestResult[];
  assumptionLibrary: AssumptionLibrary | null;
}

interface UseALMDataReturn extends ALMDataState {
  filters: GlobalFilters;
  setFilters: (filters: Partial<GlobalFilters>) => void;
  selectedScenario: Scenario | null;
  selectedMetrics: RiskMetrics | null;
  baseCurve: YieldCurve | null;
  scenarioCurve: YieldCurve | null;
  refreshData: () => void;
  getMetricsForScenario: (scenarioId: string) => RiskMetrics | null;
  getCurveForScenario: (scenarioId: string) => YieldCurve | null;
  unresolvedAlerts: Alert[];
  criticalAlerts: Alert[];
  warningAlerts: Alert[];
}

const DEFAULT_FILTERS: GlobalFilters = {
  runId: '',
  scenarioSetId: '',
  selectedScenarios: ['base', 'up_200', 'down_200'],
  horizon: '12m',
  currency: 'USD',
};

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

const RUNTIME_ID_STORAGE_KEY = 'alm-runtime-id';

const getRuntimeId = () => {
  if (typeof window === 'undefined') return null;
  const nextData = (window as Window & { __NEXT_DATA__?: { buildId?: string } }).__NEXT_DATA__;
  if (typeof nextData?.buildId === 'string' && nextData.buildId.length > 0) {
    return nextData.buildId;
  }
  const webpackHash = (window as Window & { __webpack_hash__?: string }).__webpack_hash__;
  return typeof webpackHash === 'string' && webpackHash.length > 0 ? webpackHash : null;
};

const ensureFreshRuntimeData = () => {
  const runtimeId = getRuntimeId();
  if (!runtimeId) return;
  try {
    const stored = sessionStorage.getItem(RUNTIME_ID_STORAGE_KEY);
    if (stored !== runtimeId) {
      sessionStorage.setItem(RUNTIME_ID_STORAGE_KEY, runtimeId);
      resetALMDemoData();
    }
  } catch {
    // Ignore storage failures (private mode or locked storage)
  }
};

const isValidALMDemoData = (data: ReturnType<typeof getALMDemoData>) => {
  if (!data?.currentRun || !data?.priorRun || !data?.scenarioSet || !data?.metrics) {
    return false;
  }

  if (!isArray(data.scenarioSet.scenarios)) {
    return false;
  }

  if (
    !isArray(data.curves) ||
    !data.curves.every((curve) => isArray(curve.points)) ||
    !isArray(data.positions) ||
    !isArray(data.depositProducts) ||
    !data.depositProducts.every(
      (product) =>
        product &&
        isArray(product.observedRates) &&
        isArray(product.modeledRates) &&
        product.beta &&
        isArray(product.beta.timeVaryingBeta) &&
        product.decay &&
        isArray(product.decay.survivalCurve)
    ) ||
    !isArray(data.macroSeries) ||
    !data.macroSeries.every((series) => isArray(series.points)) ||
    !isArray(data.assumptionSets) ||
    !data.assumptionSets.every((set) => isArray(set.parameters)) ||
    !isArray(data.alerts) ||
    !isArray(data.hedges) ||
    !isArray(data.backtests) ||
    !data.backtests.every(
      (backtest) => isArray(backtest.forecasts) && isArray(backtest.realized)
    )
  ) {
    return false;
  }

  if (
    !data.liquidity ||
    !isArray(data.liquidity.cashflowLadder) ||
    !isArray(data.liquidity.fundingConcentrations) ||
    !isArray(data.liquidity.contingencyReadiness)
  ) {
    return false;
  }

  if (
    !data.assumptionLibrary ||
    !data.assumptionLibrary.summaryMetrics ||
    !isArray(data.assumptionLibrary.depositBetas) ||
    !isArray(data.assumptionLibrary.loanAssumptions) ||
    !isArray(data.assumptionLibrary.basisRisks) ||
    !isArray(data.assumptionLibrary.assumptionHistory)
  ) {
    return false;
  }

  return true;
};

export function useALMData(): UseALMDataReturn {
  const [state, setState] = useState<ALMDataState>({
    isLoading: true,
    error: null,
    currentRun: null,
    priorRun: null,
    scenarioSet: null,
    curves: [],
    positions: [],
    metrics: {},
    depositProducts: [],
    macroSeries: [],
    assumptionSets: [],
    alerts: [],
    liquidity: null,
    hedges: [],
    backtests: [],
    assumptionLibrary: null,
  });

  const [filters, setFiltersState] = useState<GlobalFilters>(DEFAULT_FILTERS);

  const loadData = useCallback((isRetry = false) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      ensureFreshRuntimeData();
      const data = getALMDemoData();

      // Validate that critical data exists to catch stale cache issues early
      if (!isValidALMDemoData(data)) {
        throw new Error('Invalid data structure - cache may be stale');
      }

      setState({
        isLoading: false,
        error: null,
        currentRun: data.currentRun,
        priorRun: data.priorRun,
        scenarioSet: data.scenarioSet,
        curves: data.curves,
        positions: data.positions,
        metrics: data.metrics,
        depositProducts: data.depositProducts,
        macroSeries: data.macroSeries,
        assumptionSets: data.assumptionSets,
        alerts: data.alerts,
        liquidity: data.liquidity,
        hedges: data.hedges,
        backtests: data.backtests,
        assumptionLibrary: data.assumptionLibrary,
      });

      // Update filters with actual run IDs
      setFiltersState((prev) => ({
        ...prev,
        runId: data.currentRun.runId,
        priorRunId: data.priorRun.runId,
        scenarioSetId: data.scenarioSet.scenarioSetId,
      }));
    } catch (error) {
      // On first error, try resetting the cache and reloading
      if (!isRetry) {
        console.warn('[ALM] Data load failed, resetting cache and retrying:', error);
        resetALMDemoData();
        loadData(true);
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to load ALM data'),
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setFilters = useCallback((newFilters: Partial<GlobalFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const refreshData = useCallback(() => {
    resetALMDemoData();
    loadData();
  }, [loadData]);

  const selectedScenario = useMemo(() => {
    if (!state.scenarioSet) return null;
    const primaryScenario = filters.selectedScenarios[0] || 'base';
    return state.scenarioSet.scenarios.find((s) => s.scenarioId === primaryScenario) || null;
  }, [state.scenarioSet, filters.selectedScenarios]);

  const selectedMetrics = useMemo(() => {
    if (!selectedScenario) return null;
    return state.metrics[selectedScenario.scenarioId] || null;
  }, [state.metrics, selectedScenario]);

  const baseCurve = useMemo(() => {
    return state.curves.find((c) => c.scenarioId === 'base') || null;
  }, [state.curves]);

  const scenarioCurve = useMemo(() => {
    if (!selectedScenario) return null;
    return state.curves.find((c) => c.scenarioId === selectedScenario.scenarioId) || null;
  }, [state.curves, selectedScenario]);

  const getMetricsForScenario = useCallback(
    (scenarioId: string): RiskMetrics | null => {
      return state.metrics[scenarioId] || null;
    },
    [state.metrics]
  );

  const getCurveForScenario = useCallback(
    (scenarioId: string): YieldCurve | null => {
      return state.curves.find((c) => c.scenarioId === scenarioId) || null;
    },
    [state.curves]
  );

  const unresolvedAlerts = useMemo(() => {
    return state.alerts.filter((a) => !a.resolvedAt);
  }, [state.alerts]);

  const criticalAlerts = useMemo(() => {
    return unresolvedAlerts.filter((a) => a.severity === 'critical');
  }, [unresolvedAlerts]);

  const warningAlerts = useMemo(() => {
    return unresolvedAlerts.filter((a) => a.severity === 'warning');
  }, [unresolvedAlerts]);

  return {
    ...state,
    filters,
    setFilters,
    selectedScenario,
    selectedMetrics,
    baseCurve,
    scenarioCurve,
    refreshData,
    getMetricsForScenario,
    getCurveForScenario,
    unresolvedAlerts,
    criticalAlerts,
    warningAlerts,
  };
}

// Simplified hook for specific data slices
export function useScenarios() {
  const { scenarioSet, curves, metrics, isLoading } = useALMData();
  return { scenarioSet, curves, metrics, isLoading };
}

export function useDeposits() {
  const { depositProducts, isLoading } = useALMData();
  return { depositProducts, isLoading };
}

export function useAlerts() {
  const { alerts, unresolvedAlerts, criticalAlerts, warningAlerts, isLoading } = useALMData();
  return { alerts, unresolvedAlerts, criticalAlerts, warningAlerts, isLoading };
}

export function useLiquidity() {
  const { liquidity, isLoading } = useALMData();
  return { liquidity, isLoading };
}

export function useHedges() {
  const { hedges, isLoading } = useALMData();
  return { hedges, isLoading };
}

export function useBacktests() {
  const { backtests, isLoading } = useALMData();
  return { backtests, isLoading };
}

export function useAssumptions() {
  const { assumptionSets, assumptionLibrary, isLoading } = useALMData();
  return { assumptionSets, assumptionLibrary, isLoading };
}

export function useAssumptionLibrary() {
  const { assumptionLibrary, isLoading } = useALMData();
  return { assumptionLibrary, isLoading };
}
