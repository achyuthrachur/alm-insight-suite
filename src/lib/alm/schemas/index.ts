import { z } from 'zod';

// ============================================================================
// ALM Insight Suite - Zod Validation Schemas
// ============================================================================

// ----------------------------------------------------------------------------
// Run & Metadata Schemas
// ----------------------------------------------------------------------------

export const DataWarningSchema = z.object({
  id: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
  category: z.string(),
  message: z.string(),
  affectedData: z.array(z.string()).optional(),
});

export const RunSchema = z.object({
  runId: z.string().min(1),
  timestamp: z.coerce.date(),
  label: z.string().min(1),
  createdBy: z.string().min(1),
  notes: z.string().optional(),
  scenarioSetId: z.string().min(1),
  assumptionSetId: z.string().min(1),
  dataQualityScore: z.number().min(0).max(100),
  warnings: z.array(DataWarningSchema),
  status: z.enum(['draft', 'final', 'archived']),
});

// ----------------------------------------------------------------------------
// Scenario & Curve Schemas
// ----------------------------------------------------------------------------

export const ScenarioTagSchema = z.enum([
  'base',
  'parallel_up',
  'parallel_down',
  'steepener',
  'flattener',
  'inversion',
  'ramp_up',
  'ramp_down',
  'shock',
  'stress',
]);

export const ScenarioSchema = z.object({
  scenarioId: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().max(20),
  tags: z.array(ScenarioTagSchema),
  narrative: z.string(),
  probability: z.number().min(0).max(1).optional(),
  isBase: z.boolean(),
});

export const CurvePointSchema = z.object({
  tenorMonths: z.number().int().positive(),
  rate: z.number(),
  tenorLabel: z.string(),
});

export const YieldCurveSchema = z.object({
  curveId: z.string().min(1),
  scenarioId: z.string().min(1),
  asOfDate: z.coerce.date(),
  currency: z.string().length(3),
  curveType: z.enum(['spot', 'forward', 'par']),
  points: z.array(CurvePointSchema).min(1),
});

export const ScenarioSetSchema = z.object({
  scenarioSetId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  createdAt: z.coerce.date(),
  scenarios: z.array(ScenarioSchema).min(1),
});

// ----------------------------------------------------------------------------
// Position Schemas
// ----------------------------------------------------------------------------

export const ProductTypeSchema = z.enum([
  'cash',
  'securities_fixed',
  'securities_floating',
  'loans_commercial',
  'loans_consumer',
  'loans_mortgage',
  'loans_cre',
  'deposits_dda',
  'deposits_now',
  'deposits_mmda',
  'deposits_savings',
  'deposits_cd',
  'borrowings_fhlb',
  'borrowings_repo',
  'borrowings_sub_debt',
  'swap_pay_fixed',
  'swap_receive_fixed',
  'cap',
  'floor',
  'collar',
  'swaption',
]);

export const PositionSchema = z.object({
  id: z.string().min(1),
  category: z.enum(['asset', 'liability', 'derivative', 'off_balance']),
  productType: ProductTypeSchema,
  productName: z.string().min(1),
  segment: z.string().optional(),
  currency: z.string().length(3),
  balance: z.number(),
  notional: z.number().optional(),
  coupon: z.number().optional(),
  rateType: z.enum(['fixed', 'floating', 'hybrid']),
  index: z.string().optional(),
  spread: z.number().optional(),
  floor: z.number().optional(),
  cap: z.number().optional(),
  nextRepriceDate: z.coerce.date().optional(),
  maturityDate: z.coerce.date().optional(),
  hasOptionality: z.boolean(),
  optionalityType: z.enum(['prepay', 'call', 'put', 'cap', 'floor']).optional(),
  accountingClassification: z.enum(['HTM', 'AFS', 'trading']).optional(),
  duration: z.number().optional(),
  convexity: z.number().optional(),
});

export const CashflowSchema = z.object({
  positionId: z.string().min(1),
  date: z.coerce.date(),
  principal: z.number(),
  interest: z.number(),
  scenarioId: z.string().optional(),
});

// ----------------------------------------------------------------------------
// Risk Metrics Schemas
// ----------------------------------------------------------------------------

export const HorizonTypeSchema = z.enum(['1m', '3m', '6m', '12m', '24m', '36m']);

export const NIIResultSchema = z.object({
  baseNII: z.number(),
  projectedNII: z.number(),
  impactAmount: z.number(),
  impactPercent: z.number(),
  impactBps: z.number(),
  nim: z.number(),
  nimChange: z.number(),
});

export const EVEResultSchema = z.object({
  baseEVE: z.number(),
  stressedEVE: z.number(),
  impactAmount: z.number(),
  impactPercent: z.number(),
  assetPV: z.number(),
  assetPVChange: z.number(),
  liabilityPV: z.number(),
  liabilityPVChange: z.number(),
  derivativePV: z.number(),
  derivativePVChange: z.number(),
});

export const DurationMetricsSchema = z.object({
  assetDuration: z.number(),
  liabilityDuration: z.number(),
  equityDuration: z.number(),
  durationGap: z.number(),
  dv01: z.number(),
  convexity: z.number(),
});

export const RepricingGapSchema = z.object({
  bucket: z.string(),
  bucketStart: z.number(),
  bucketEnd: z.number(),
  assets: z.number(),
  liabilities: z.number(),
  gap: z.number(),
  cumulativeGap: z.number(),
  gapRatio: z.number(),
});

export const LimitStatusSchema = z.object({
  limitId: z.string(),
  limitName: z.string(),
  metric: z.string(),
  currentValue: z.number(),
  warningThreshold: z.number(),
  criticalThreshold: z.number(),
  status: z.enum(['ok', 'warning', 'breach']),
  utilizationPercent: z.number(),
  trend: z.enum(['improving', 'stable', 'deteriorating']),
});

export const RiskMetricsSchema = z.object({
  runId: z.string(),
  scenarioId: z.string(),
  horizon: HorizonTypeSchema,
  asOfDate: z.coerce.date(),
  nii: NIIResultSchema,
  eve: EVEResultSchema,
  duration: DurationMetricsSchema,
  repricing: z.array(RepricingGapSchema),
  limits: z.array(LimitStatusSchema),
});

// ----------------------------------------------------------------------------
// Deposit Behavior Schemas
// ----------------------------------------------------------------------------

export const RateSeriesSchema = z.object({
  date: z.coerce.date(),
  rate: z.number(),
});

export const BetaMetricsSchema = z.object({
  levelBeta: z.number().min(0).max(2),
  passThroughSlope: z.number(),
  timeVaryingBeta: z.array(z.number()),
  confidenceInterval: z.object({
    lower: z.number(),
    upper: z.number(),
  }),
  rSquared: z.number().min(0).max(1),
  stability: z.enum(['stable', 'moderate', 'volatile']),
  lastUpdated: z.coerce.date(),
});

export const SurvivalPointSchema = z.object({
  month: z.number().int().nonnegative(),
  survivalRate: z.number().min(0).max(1),
  confidence: z.number().optional(),
});

export const DecayParametersSchema = z.object({
  modelType: z.enum(['exponential', 'weibull', 'empirical']),
  decayRate: z.number(),
  halfLife: z.number(),
  survivalCurve: z.array(SurvivalPointSchema),
  assumedMaturity: z.number(),
  realizedMaturity: z.number().optional(),
});

export const DepositProductSchema = z.object({
  productId: z.string(),
  productType: ProductTypeSchema,
  productName: z.string(),
  segment: z.string().optional(),
  region: z.string().optional(),
  balance: z.number(),
  observedRates: z.array(RateSeriesSchema),
  modeledRates: z.array(RateSeriesSchema),
  beta: BetaMetricsSchema,
  decay: DecayParametersSchema,
  effectiveMaturity: z.number(),
});

// ----------------------------------------------------------------------------
// Macro Sensitivity Schemas
// ----------------------------------------------------------------------------

export const MacroDataPointSchema = z.object({
  date: z.coerce.date(),
  value: z.number(),
});

export const MacroSeriesSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  units: z.string(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  points: z.array(MacroDataPointSchema),
  source: z.string().optional(),
});

export const CorrelationResultSchema = z.object({
  variable1: z.string(),
  variable2: z.string(),
  correlation: z.number().min(-1).max(1),
  pValue: z.number().min(0).max(1),
  lag: z.number().int(),
  regime: z.enum(['rising', 'falling', 'all']).optional(),
  significance: z.enum(['high', 'moderate', 'low', 'none']),
});

// ----------------------------------------------------------------------------
// Assumptions Schemas
// ----------------------------------------------------------------------------

export const AssumptionCategorySchema = z.enum([
  'prepayment',
  'beta',
  'decay',
  'growth',
  'pricing',
  'credit',
  'liquidity',
  'operational',
]);

export const AssumptionScopeSchema = z.enum(['portfolio', 'product', 'segment']);

export const ApprovalSchema = z.object({
  approver: z.string(),
  role: z.string(),
  timestamp: z.coerce.date(),
  decision: z.enum(['approved', 'rejected', 'pending']),
  comments: z.string().optional(),
});

export const CommentSchema = z.object({
  id: z.string(),
  author: z.string(),
  timestamp: z.coerce.date(),
  content: z.string(),
  replyTo: z.string().optional(),
});

export const AssumptionParamSchema = z.object({
  key: z.string(),
  label: z.string(),
  category: AssumptionCategorySchema,
  value: z.union([z.number(), z.string(), z.boolean()]),
  unit: z.string().optional(),
  scope: AssumptionScopeSchema,
  productFilter: z.string().optional(),
  segmentFilter: z.string().optional(),
  rationale: z.string(),
  evidenceRefs: z.array(z.string()),
  sensitivity: z.enum(['high', 'medium', 'low']).optional(),
  lastBacktested: z.coerce.date().optional(),
});

export const AssumptionSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number().int().positive(),
  status: z.enum(['draft', 'review', 'approved', 'archived']),
  owner: z.string(),
  effectiveDate: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  approvedAt: z.coerce.date().optional(),
  approvedBy: z.string().optional(),
  approvals: z.array(ApprovalSchema),
  comments: z.array(CommentSchema),
  parameters: z.array(AssumptionParamSchema),
});

export const AssumptionDiffSchema = z.object({
  paramKey: z.string(),
  paramLabel: z.string(),
  category: AssumptionCategorySchema,
  oldValue: z.union([z.number(), z.string(), z.boolean()]),
  newValue: z.union([z.number(), z.string(), z.boolean()]),
  changeType: z.enum(['added', 'removed', 'modified']),
  estimatedImpact: z
    .object({
      niiImpact: z.number(),
      eveImpact: z.number(),
    })
    .optional(),
});

// ----------------------------------------------------------------------------
// Alert Schemas
// ----------------------------------------------------------------------------

export const AlertTypeSchema = z.enum([
  'limit_breach',
  'limit_warning',
  'anomaly',
  'model_drift',
  'data_quality',
  'assumption_change',
  'market_event',
]);

export const AlertSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
  type: AlertTypeSchema,
  title: z.string(),
  description: z.string(),
  metric: z.string().optional(),
  currentValue: z.number().optional(),
  threshold: z.number().optional(),
  createdAt: z.coerce.date(),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.coerce.date().optional(),
  resolvedAt: z.coerce.date().optional(),
  linkedModule: z.string().optional(),
  linkedFilters: z.record(z.string()).optional(),
});

export const LimitMetricSchema = z.enum([
  'EVE_CHANGE',
  'EVE_RATIO',
  'NII_CHANGE',
  'NII_RATIO',
  'DV01',
  'DOE',
  'LIQUIDITY_HORIZON',
  'GAP_RATIO',
  'BETA_LEVEL',
  'BETA_STABILITY',
]);

export const LimitDefinitionSchema = z.object({
  id: z.string(),
  metric: LimitMetricSchema,
  name: z.string(),
  description: z.string(),
  warningThreshold: z.number(),
  criticalThreshold: z.number(),
  direction: z.enum(['above', 'below', 'outside']),
  scope: z
    .object({
      product: z.string().optional(),
      segment: z.string().optional(),
      scenario: z.string().optional(),
    })
    .optional(),
  enabled: z.boolean(),
});

// ----------------------------------------------------------------------------
// Liquidity Schemas
// ----------------------------------------------------------------------------

export const CashflowBucketSchema = z.object({
  bucket: z.string(),
  bucketDays: z.number(),
  inflows: z.number(),
  outflows: z.number(),
  netFlow: z.number(),
  cumulativeGap: z.number(),
  availableLiquidity: z.number(),
});

export const FundingConcentrationSchema = z.object({
  sourceType: z.string(),
  sourceName: z.string(),
  amount: z.number(),
  percentOfTotal: z.number(),
  maturityProfile: z.enum(['short', 'medium', 'long', 'mixed']),
  riskLevel: z.enum(['low', 'medium', 'high']),
});

export const ContingencyItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  item: z.string(),
  status: z.enum(['ready', 'partial', 'not_ready']),
  score: z.number().min(0).max(100),
  notes: z.string().optional(),
  lastTested: z.coerce.date().optional(),
});

export const LiquidityMetricsSchema = z.object({
  runId: z.string(),
  asOfDate: z.coerce.date(),
  survivalHorizon: z.number(),
  survivalHorizonTarget: z.number(),
  cashflowLadder: z.array(CashflowBucketSchema),
  fundingConcentrations: z.array(FundingConcentrationSchema),
  contingencyReadiness: z.array(ContingencyItemSchema),
  overallScore: z.number(),
});

// ----------------------------------------------------------------------------
// Global Filters Schema
// ----------------------------------------------------------------------------

export const GlobalFiltersSchema = z.object({
  runId: z.string(),
  priorRunId: z.string().optional(),
  scenarioSetId: z.string(),
  selectedScenarios: z.array(z.string()),
  horizon: HorizonTypeSchema,
  currency: z.string().length(3),
  institution: z.string().optional(),
});

// ----------------------------------------------------------------------------
// Type Exports
// ----------------------------------------------------------------------------

export type ValidatedRun = z.infer<typeof RunSchema>;
export type ValidatedScenario = z.infer<typeof ScenarioSchema>;
export type ValidatedYieldCurve = z.infer<typeof YieldCurveSchema>;
export type ValidatedPosition = z.infer<typeof PositionSchema>;
export type ValidatedRiskMetrics = z.infer<typeof RiskMetricsSchema>;
export type ValidatedDepositProduct = z.infer<typeof DepositProductSchema>;
export type ValidatedAssumptionSet = z.infer<typeof AssumptionSetSchema>;
export type ValidatedAlert = z.infer<typeof AlertSchema>;
export type ValidatedGlobalFilters = z.infer<typeof GlobalFiltersSchema>;
