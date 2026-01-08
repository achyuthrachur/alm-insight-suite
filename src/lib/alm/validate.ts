// ============================================================================
// ALM Data Validation - Cross-Object Reconciliation Checks
// Implements BCBS 239 principles: completeness, accuracy, consistency
// ============================================================================

import type {
  ScenarioSet,
  YieldCurve,
  Position,
  RiskMetrics,
  EVEResult,
  NIIResult,
  ALMDataExport,
} from './types';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  checksRun: number;
  checksPassed: number;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  expected?: number | string;
  actual?: number | string;
  severity: 'error';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  severity: 'warning';
}

// Tolerance for floating point comparisons
const TOLERANCE = 0.001; // 0.1% tolerance for reconciliation
const BALANCE_TOLERANCE = 1000; // $1000 tolerance for balance sheet checks

/**
 * Validate that scenario IDs referenced in curves and metrics exist in scenario set
 */
export function validateScenarioReferences(
  scenarioSet: ScenarioSet,
  curves: YieldCurve[],
  metrics: Record<string, RiskMetrics>
): ValidationError[] {
  const errors: ValidationError[] = [];
  const validScenarioIds = new Set(scenarioSet.scenarios.map(s => s.scenarioId));

  // Check curves
  for (const curve of curves) {
    if (!validScenarioIds.has(curve.scenarioId)) {
      errors.push({
        code: 'INVALID_SCENARIO_REF',
        message: `Curve ${curve.curveId} references unknown scenario: ${curve.scenarioId}`,
        field: 'curves.scenarioId',
        expected: Array.from(validScenarioIds).join(', '),
        actual: curve.scenarioId,
        severity: 'error',
      });
    }
  }

  // Check metrics
  for (const scenarioId of Object.keys(metrics)) {
    if (!validScenarioIds.has(scenarioId)) {
      errors.push({
        code: 'INVALID_SCENARIO_REF',
        message: `Metrics reference unknown scenario: ${scenarioId}`,
        field: 'metrics.scenarioId',
        expected: Array.from(validScenarioIds).join(', '),
        actual: scenarioId,
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * Validate that scenario probabilities sum to 1 (if all provided)
 */
export function validateScenarioProbabilities(scenarioSet: ScenarioSet): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const probabilities = scenarioSet.scenarios
    .map(s => s.probability)
    .filter((p): p is number => p !== undefined);

  if (probabilities.length > 0 && probabilities.length === scenarioSet.scenarios.length) {
    const sum = probabilities.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > TOLERANCE) {
      warnings.push({
        code: 'PROBABILITY_SUM',
        message: `Scenario probabilities sum to ${sum.toFixed(4)}, expected 1.0`,
        field: 'scenarioSet.scenarios.probability',
        severity: 'warning',
      });
    }
  }

  return warnings;
}

/**
 * Validate EVE decomposition reconciles:
 * assetPVChange - liabilityPVChange + derivativePVChange ≈ impactAmount
 */
export function validateEVEReconciliation(eve: EVEResult): ValidationError[] {
  const errors: ValidationError[] = [];

  const calculatedImpact = eve.assetPVChange - eve.liabilityPVChange + eve.derivativePVChange;
  const tolerance = Math.abs(eve.impactAmount) * TOLERANCE || BALANCE_TOLERANCE;

  if (Math.abs(calculatedImpact - eve.impactAmount) > tolerance) {
    errors.push({
      code: 'EVE_RECONCILIATION',
      message: 'EVE breakdown does not reconcile to total impact',
      field: 'eve',
      expected: eve.impactAmount,
      actual: calculatedImpact,
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Validate NIM is within reasonable range (0-10%)
 */
export function validateNIMSanity(nii: NIIResult): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (nii.nim < 0 || nii.nim > 10) {
    warnings.push({
      code: 'NIM_RANGE',
      message: `NIM of ${nii.nim.toFixed(2)}% is outside typical range (0-10%)`,
      field: 'nii.nim',
      severity: 'warning',
    });
  }

  return warnings;
}

/**
 * Validate position totals: Assets - Liabilities ≈ Equity
 * Returns both calculated equity and any discrepancy warnings
 */
export function validateBalanceSheet(
  positions: Position[],
  expectedEquity?: number
): { calculatedEquity: number; errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const assets = positions
    .filter(p => p.category === 'asset')
    .reduce((sum, p) => sum + Math.abs(p.balance), 0);

  const liabilities = positions
    .filter(p => p.category === 'liability')
    .reduce((sum, p) => sum + Math.abs(p.balance), 0);

  const calculatedEquity = assets - liabilities;

  if (expectedEquity !== undefined) {
    const tolerance = Math.max(expectedEquity * TOLERANCE, BALANCE_TOLERANCE);
    if (Math.abs(calculatedEquity - expectedEquity) > tolerance) {
      errors.push({
        code: 'BALANCE_SHEET_RECONCILIATION',
        message: 'Position totals do not reconcile to expected equity',
        field: 'positions',
        expected: expectedEquity,
        actual: calculatedEquity,
        severity: 'error',
      });
    }
  }

  // Warning if liabilities exceed assets (negative equity)
  if (calculatedEquity < 0) {
    warnings.push({
      code: 'NEGATIVE_EQUITY',
      message: `Calculated equity is negative: ${calculatedEquity.toLocaleString()}`,
      field: 'positions',
      severity: 'warning',
    });
  }

  return { calculatedEquity, errors, warnings };
}

/**
 * Validate all metrics exist for all scenarios in the scenario set
 */
export function validateMetricsCompleteness(
  scenarioSet: ScenarioSet,
  metrics: Record<string, RiskMetrics>
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  for (const scenario of scenarioSet.scenarios) {
    if (!metrics[scenario.scenarioId]) {
      warnings.push({
        code: 'MISSING_METRICS',
        message: `No metrics found for scenario: ${scenario.scenarioId}`,
        field: 'metrics',
        severity: 'warning',
      });
    }
  }

  return warnings;
}

/**
 * Validate curves have required tenors
 */
export function validateCurveTenors(curves: YieldCurve[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const requiredTenors = [1, 3, 12, 60, 120, 360]; // 1M, 3M, 1Y, 5Y, 10Y, 30Y

  for (const curve of curves) {
    const curveMonths = new Set(curve.points.map(p => p.tenorMonths));
    for (const tenor of requiredTenors) {
      if (!curveMonths.has(tenor)) {
        warnings.push({
          code: 'MISSING_TENOR',
          message: `Curve ${curve.curveId} missing standard tenor: ${tenor}M`,
          field: `curves.${curve.curveId}`,
          severity: 'warning',
        });
      }
    }
  }

  return warnings;
}

/**
 * Validate rates are in reasonable range (0-15%)
 */
export function validateRateRanges(curves: YieldCurve[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  for (const curve of curves) {
    for (const point of curve.points) {
      if (point.rate < 0) {
        warnings.push({
          code: 'NEGATIVE_RATE',
          message: `Negative rate ${(point.rate * 100).toFixed(2)}% at ${point.tenorLabel} in curve ${curve.curveId}`,
          field: `curves.${curve.curveId}.points`,
          severity: 'warning',
        });
      }
      if (point.rate > 0.15) {
        warnings.push({
          code: 'HIGH_RATE',
          message: `Unusually high rate ${(point.rate * 100).toFixed(2)}% at ${point.tenorLabel} in curve ${curve.curveId}`,
          field: `curves.${curve.curveId}.points`,
          severity: 'warning',
        });
      }
    }
  }

  return warnings;
}

/**
 * Full validation of an ALM data export
 */
export function validateALMDataExport(data: ALMDataExport): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let checksRun = 0;

  // 1. Scenario reference validation
  checksRun++;
  errors.push(...validateScenarioReferences(data.scenarioSet, data.curves, data.metrics));

  // 2. Scenario probability validation
  checksRun++;
  warnings.push(...validateScenarioProbabilities(data.scenarioSet));

  // 3. EVE reconciliation for each scenario
  for (const scenarioId of Object.keys(data.metrics)) {
    checksRun++;
    const metric = data.metrics[scenarioId];
    if (metric?.eve) {
      errors.push(...validateEVEReconciliation(metric.eve));
    }
  }

  // 4. NIM sanity check for each scenario
  for (const scenarioId of Object.keys(data.metrics)) {
    checksRun++;
    const metric = data.metrics[scenarioId];
    if (metric?.nii) {
      warnings.push(...validateNIMSanity(metric.nii));
    }
  }

  // 5. Balance sheet validation
  checksRun++;
  const baseMetrics = data.metrics['base'];
  const expectedEquity = baseMetrics?.eve?.baseEVE;
  const balanceCheck = validateBalanceSheet(data.positions, expectedEquity);
  errors.push(...balanceCheck.errors);
  warnings.push(...balanceCheck.warnings);

  // 6. Metrics completeness
  checksRun++;
  warnings.push(...validateMetricsCompleteness(data.scenarioSet, data.metrics));

  // 7. Curve tenor validation
  checksRun++;
  warnings.push(...validateCurveTenors(data.curves));

  // 8. Rate range validation
  checksRun++;
  warnings.push(...validateRateRanges(data.curves));

  const checksPassed = checksRun - errors.length;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checksRun,
    checksPassed,
  };
}

/**
 * Quick validation that throws on critical errors
 */
export function validateOrThrow(data: ALMDataExport): void {
  const result = validateALMDataExport(data);
  if (!result.valid) {
    const errorMessages = result.errors.map(e => e.message).join('; ');
    throw new Error(`ALM data validation failed: ${errorMessages}`);
  }
}

/**
 * Get a summary of validation results for display
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return `✓ All ${result.checksRun} validation checks passed`;
  }

  const parts: string[] = [];
  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error(s)`);
  }
  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning(s)`);
  }

  const status = result.valid ? '⚠' : '✗';
  return `${status} ${result.checksPassed}/${result.checksRun} checks passed - ${parts.join(', ')}`;
}
