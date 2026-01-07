// ============================================================================
// ALM Insight Suite - Domain Types
// ============================================================================

// ----------------------------------------------------------------------------
// Run & Metadata Types
// ----------------------------------------------------------------------------

export interface Run {
  runId: string;
  timestamp: Date;
  label: string;
  createdBy: string;
  notes?: string;
  scenarioSetId: string;
  assumptionSetId: string;
  dataQualityScore: number; // 0-100
  warnings: DataWarning[];
  status: 'draft' | 'final' | 'archived';
}

export interface DataWarning {
  id: string;
  severity: 'info' | 'warning' | 'error';
  category: string;
  message: string;
  affectedData?: string[];
}

export interface RunComparison {
  currentRun: Run;
  priorRun: Run;
  deltaDays: number;
}

// ----------------------------------------------------------------------------
// Scenario & Curve Types
// ----------------------------------------------------------------------------

export interface ScenarioSet {
  scenarioSetId: string;
  name: string;
  description: string;
  createdAt: Date;
  scenarios: Scenario[];
}

export interface Scenario {
  scenarioId: string;
  name: string;
  shortName: string;
  tags: ScenarioTag[];
  narrative: string;
  probability?: number;
  isBase: boolean;
}

export type ScenarioTag =
  | 'base'
  | 'parallel_up'
  | 'parallel_down'
  | 'steepener'
  | 'flattener'
  | 'inversion'
  | 'ramp_up'
  | 'ramp_down'
  | 'shock'
  | 'stress';

export interface YieldCurve {
  curveId: string;
  scenarioId: string;
  asOfDate: Date;
  currency: string;
  curveType: 'spot' | 'forward' | 'par';
  points: CurvePoint[];
}

export interface CurvePoint {
  tenorMonths: number;
  rate: number; // in decimal (e.g., 0.045 for 4.5%)
  tenorLabel: string; // e.g., "1M", "3M", "1Y", "10Y"
}

// ----------------------------------------------------------------------------
// Position Types
// ----------------------------------------------------------------------------

export interface Position {
  id: string;
  category: 'asset' | 'liability' | 'derivative' | 'off_balance';
  productType: ProductType;
  productName: string;
  segment?: string;
  currency: string;
  balance: number;
  notional?: number;
  coupon?: number;
  rateType: 'fixed' | 'floating' | 'hybrid';
  index?: string; // e.g., "SOFR", "Prime"
  spread?: number;
  floor?: number;
  cap?: number;
  nextRepriceDate?: Date;
  maturityDate?: Date;
  hasOptionality: boolean;
  optionalityType?: 'prepay' | 'call' | 'put' | 'cap' | 'floor';
  accountingClassification?: 'HTM' | 'AFS' | 'trading';
  duration?: number;
  convexity?: number;
}

export type ProductType =
  // Assets
  | 'cash'
  | 'securities_fixed'
  | 'securities_floating'
  | 'loans_commercial'
  | 'loans_consumer'
  | 'loans_mortgage'
  | 'loans_cre'
  // Liabilities
  | 'deposits_dda'
  | 'deposits_now'
  | 'deposits_mmda'
  | 'deposits_savings'
  | 'deposits_cd'
  | 'borrowings_fhlb'
  | 'borrowings_repo'
  | 'borrowings_sub_debt'
  // Derivatives
  | 'swap_pay_fixed'
  | 'swap_receive_fixed'
  | 'cap'
  | 'floor'
  | 'collar'
  | 'swaption';

export interface Cashflow {
  positionId: string;
  date: Date;
  principal: number;
  interest: number;
  scenarioId?: string;
}

export interface PositionSummary {
  category: 'asset' | 'liability' | 'derivative';
  productType: ProductType;
  totalBalance: number;
  weightedAvgRate: number;
  weightedAvgDuration: number;
  count: number;
}

// ----------------------------------------------------------------------------
// Risk Metrics Types
// ----------------------------------------------------------------------------

export interface RiskMetrics {
  runId: string;
  scenarioId: string;
  horizon: HorizonType;
  asOfDate: Date;
  nii: NIIResult;
  eve: EVEResult;
  duration: DurationMetrics;
  repricing: RepricingGap[];
  limits: LimitStatus[];
}

export type HorizonType = '1m' | '3m' | '6m' | '12m' | '24m' | '36m';

export interface NIIResult {
  baseNII: number;
  projectedNII: number;
  impactAmount: number;
  impactPercent: number;
  impactBps: number;
  nim: number; // Net Interest Margin
  nimChange: number;
}

export interface EVEResult {
  baseEVE: number;
  stressedEVE: number;
  impactAmount: number;
  impactPercent: number;
  assetPV: number;
  assetPVChange: number;
  liabilityPV: number;
  liabilityPVChange: number;
  derivativePV: number;
  derivativePVChange: number;
}

export interface DurationMetrics {
  assetDuration: number;
  liabilityDuration: number;
  equityDuration: number; // DOE
  durationGap: number;
  dv01: number;
  convexity: number;
}

export interface RepricingGap {
  bucket: string; // e.g., "0-30 days", "31-90 days"
  bucketStart: number; // days
  bucketEnd: number;
  assets: number;
  liabilities: number;
  gap: number;
  cumulativeGap: number;
  gapRatio: number;
}

// ----------------------------------------------------------------------------
// Deposit Behavior Types
// ----------------------------------------------------------------------------

export interface DepositProduct {
  productId: string;
  productType: ProductType;
  productName: string;
  segment?: string;
  region?: string;
  balance: number;
  observedRates: RateSeries[];
  modeledRates: RateSeries[];
  beta: BetaMetrics;
  decay: DecayParameters;
  effectiveMaturity: number; // months
}

export interface RateSeries {
  date: Date;
  rate: number;
}

export interface BetaMetrics {
  levelBeta: number;
  passThroughSlope: number;
  timeVaryingBeta: number[];
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  rSquared: number;
  stability: 'stable' | 'moderate' | 'volatile';
  lastUpdated: Date;
}

export interface DecayParameters {
  modelType: 'exponential' | 'weibull' | 'empirical';
  decayRate: number;
  halfLife: number; // months
  survivalCurve: SurvivalPoint[];
  assumedMaturity: number; // months
  realizedMaturity?: number; // months (for backtesting)
}

export interface SurvivalPoint {
  month: number;
  survivalRate: number;
  confidence?: number;
}

// ----------------------------------------------------------------------------
// Macro Sensitivity Types
// ----------------------------------------------------------------------------

export interface MacroSeries {
  id: string;
  name: string;
  shortName: string;
  units: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  points: MacroDataPoint[];
  source?: string;
}

export interface MacroDataPoint {
  date: Date;
  value: number;
}

export interface CorrelationResult {
  variable1: string;
  variable2: string;
  correlation: number;
  pValue: number;
  lag: number; // months
  regime?: 'rising' | 'falling' | 'all';
  significance: 'high' | 'moderate' | 'low' | 'none';
}

export interface MacroDriver {
  variableName: string;
  impact: number;
  direction: 'positive' | 'negative';
  lag: number;
  explanation: string;
}

// ----------------------------------------------------------------------------
// Assumptions & Governance Types
// ----------------------------------------------------------------------------

export interface AssumptionSet {
  id: string;
  name: string;
  version: number;
  status: 'draft' | 'review' | 'approved' | 'archived';
  owner: string;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  approvals: Approval[];
  comments: Comment[];
  parameters: AssumptionParam[];
}

export interface AssumptionParam {
  key: string;
  label: string;
  category: AssumptionCategory;
  value: number | string | boolean;
  unit?: string;
  scope: AssumptionScope;
  productFilter?: string;
  segmentFilter?: string;
  rationale: string;
  evidenceRefs: string[];
  sensitivity?: 'high' | 'medium' | 'low';
  lastBacktested?: Date;
}

export type AssumptionCategory =
  | 'prepayment'
  | 'deposit_beta'
  | 'loan_beta'
  | 'repricing'
  | 'decay'
  | 'growth'
  | 'pricing'
  | 'credit'
  | 'liquidity'
  | 'operational'
  | 'basis_risk'
  | 'optionality';

export type AssumptionScope = 'portfolio' | 'product' | 'segment';

// ----------------------------------------------------------------------------
// Comprehensive Beta & Assumption Types
// ----------------------------------------------------------------------------

export interface LoanAssumptions {
  productId: string;
  productType: ProductType;
  productName: string;
  segment?: string;
  balance: number;
  prepayment: PrepaymentAssumptions;
  pricingBeta: LoanPricingBeta;
  creditAssumptions: CreditAssumptions;
  repricingAssumptions: RepricingAssumptions;
  historicalValues: AssumptionHistoryPoint[];
}

export interface PrepaymentAssumptions {
  baselineCPR: number; // Conditional Prepayment Rate %
  incentiveCPR: number; // Rate-driven prepay %
  seasonalityAdjustment: number[];  // 12 monthly adjustments
  burnoutFactor: number; // Prepay exhaustion factor
  refiThreshold: number; // Rate threshold for refi (bps)
  modelType: 'PSA' | 'CPR' | 'SMM' | 'custom';
  psaMultiple?: number; // If PSA model
  smmRate?: number; // Single Monthly Mortality
  historicalCPR: { date: Date; value: number }[];
}

export interface LoanPricingBeta {
  indexType: 'SOFR' | 'Prime' | 'Treasury' | 'Fed_Funds' | 'custom';
  levelBeta: number; // Rate sensitivity (0 = fixed, 1 = full float)
  spreadBeta: number; // Spread sensitivity to market
  lagMonths: number; // Repricing lag in months
  floor?: number; // Rate floor
  cap?: number; // Rate cap
  rSquared: number;
  stability: 'stable' | 'moderate' | 'volatile';
  historicalBeta: { date: Date; value: number }[];
}

export interface CreditAssumptions {
  expectedLossRate: number; // Annual expected loss %
  pdRate: number; // Probability of Default %
  lgdRate: number; // Loss Given Default %
  migrationMatrix?: number[][]; // Rating migration probabilities
  stressMultiplier: number; // Multiplier for stress scenarios
  historicalLoss: { date: Date; value: number }[];
}

export interface RepricingAssumptions {
  repricingFrequency: 'daily' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'at_maturity';
  indexLag: number; // Days lag from index reset
  basisSpread: number; // Spread to index (bps)
  resetDate?: number; // Day of month for reset
  lookbackPeriod?: number; // Days for averaging
  compoundingMethod?: 'simple' | 'compound' | 'daily_compound';
}

export interface AssumptionHistoryPoint {
  asOfDate: Date;
  category: AssumptionCategory;
  parameterKey: string;
  parameterLabel: string;
  value: number;
  priorValue?: number;
  changeReason?: string;
  approvedBy?: string;
}

// Enhanced Deposit Beta with more detail
export interface EnhancedDepositBeta {
  productId: string;
  productName: string;
  productType: ProductType;
  segment: string;
  balance: number;

  // Current Beta Values
  levelBeta: number; // Overall rate sensitivity
  cumulativeBeta: number; // Pass-through since cycle start
  incrementalBeta: number; // Most recent period beta

  // Beta Components
  upBeta: number; // Beta in rising rate environment
  downBeta: number; // Beta in falling rate environment
  asymmetryRatio: number; // Up/Down beta ratio

  // Lag Analysis
  lagMonths: number; // Average lag to market
  lagDistribution: number[]; // % responding at each month

  // Statistical Quality
  rSquared: number;
  standardError: number;
  confidenceInterval: { lower: number; upper: number };
  sampleSize: number;
  stability: 'stable' | 'moderate' | 'volatile';

  // Historical Series
  historicalBeta: { date: Date; value: number; marketRate: number; productRate: number }[];

  // Peer Comparison
  peerBetaAvg?: number;
  peerBetaRange?: { min: number; max: number };

  // Model Info
  modelType: 'regression' | 'kalman' | 'time_varying' | 'machine_learning';
  lastCalibrated: Date;
  nextReviewDate: Date;
}

// Comprehensive Repricing Gap Analysis
export interface EnhancedRepricingGap {
  bucket: string;
  bucketStart: number;
  bucketEnd: number;

  // Asset Breakdown
  assets: {
    total: number;
    fixed: number;
    floating: number;
    byProduct: { productType: ProductType; amount: number }[];
  };

  // Liability Breakdown
  liabilities: {
    total: number;
    fixed: number;
    floating: number;
    byProduct: { productType: ProductType; amount: number }[];
  };

  // Derivatives
  derivativeNotional: number;
  derivativeDirection: 'pay_fixed' | 'receive_fixed' | 'neutral';

  // Gap Metrics
  grossGap: number;
  netGap: number;
  cumulativeGap: number;
  gapRatio: number;
  betaAdjustedGap: number; // Gap adjusted for deposit betas

  // Sensitivity
  niiImpact100bp: number;
  eveImpact100bp: number;
}

// Index Basis Risk
export interface BasisRiskAssumptions {
  indexPair: { index1: string; index2: string };
  historicalSpread: { date: Date; spread: number }[];
  currentSpread: number;
  volatility: number;
  correlation: number;
  stressSpread: number;
  exposureAmount: number;
}

// Optionality Assumptions
export interface OptionAssumptions {
  productId: string;
  productType: ProductType;
  optionType: 'prepay' | 'call' | 'put' | 'cap' | 'floor' | 'collar';
  strikeRate?: number;
  currentIntrinsicValue: number;
  impliedVolatility: number;
  timeValue: number;
  behavioralMultiplier: number; // Actual vs optimal exercise
  historicalExercise: { date: Date; exerciseRate: number }[];
}

// Assumption Library - aggregates all assumptions with history
export interface AssumptionLibrary {
  asOfDate: Date;
  depositBetas: EnhancedDepositBeta[];
  loanAssumptions: LoanAssumptions[];
  basisRisks: BasisRiskAssumptions[];
  optionAssumptions: OptionAssumptions[];
  assumptionHistory: AssumptionHistoryPoint[];
  summaryMetrics: {
    avgDepositBeta: number;
    avgLoanPrepayment: number;
    avgLoanBeta: number;
    totalBetaAdjustedGap: number;
  };
}

export interface Approval {
  approver: string;
  role: string;
  timestamp: Date;
  decision: 'approved' | 'rejected' | 'pending';
  comments?: string;
}

export interface Comment {
  id: string;
  author: string;
  timestamp: Date;
  content: string;
  replyTo?: string;
}

export interface AssumptionDiff {
  paramKey: string;
  paramLabel: string;
  category: AssumptionCategory;
  oldValue: number | string | boolean;
  newValue: number | string | boolean;
  changeType: 'added' | 'removed' | 'modified';
  estimatedImpact?: {
    niiImpact: number;
    eveImpact: number;
  };
}

// ----------------------------------------------------------------------------
// Alert & Monitoring Types
// ----------------------------------------------------------------------------

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: AlertType;
  title: string;
  description: string;
  metric?: string;
  currentValue?: number;
  threshold?: number;
  createdAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  linkedModule?: string;
  linkedFilters?: Record<string, string>;
}

export type AlertType =
  | 'limit_breach'
  | 'limit_warning'
  | 'anomaly'
  | 'model_drift'
  | 'data_quality'
  | 'assumption_change'
  | 'market_event';

export interface LimitDefinition {
  id: string;
  metric: LimitMetric;
  name: string;
  description: string;
  warningThreshold: number;
  criticalThreshold: number;
  direction: 'above' | 'below' | 'outside';
  scope?: {
    product?: string;
    segment?: string;
    scenario?: string;
  };
  enabled: boolean;
}

export type LimitMetric =
  | 'EVE_CHANGE'
  | 'EVE_RATIO'
  | 'NII_CHANGE'
  | 'NII_RATIO'
  | 'DV01'
  | 'DOE'
  | 'LIQUIDITY_HORIZON'
  | 'GAP_RATIO'
  | 'BETA_LEVEL'
  | 'BETA_STABILITY';

export interface LimitStatus {
  limitId: string;
  limitName: string;
  metric: LimitMetric;
  currentValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  status: 'ok' | 'warning' | 'breach';
  utilizationPercent: number;
  trend: 'improving' | 'stable' | 'deteriorating';
}

// ----------------------------------------------------------------------------
// Liquidity Types
// ----------------------------------------------------------------------------

export interface LiquidityMetrics {
  runId: string;
  asOfDate: Date;
  survivalHorizon: number; // days
  survivalHorizonTarget: number;
  cashflowLadder: CashflowBucket[];
  fundingConcentrations: FundingConcentration[];
  contingencyReadiness: ContingencyItem[];
  overallScore: number;
}

export interface CashflowBucket {
  bucket: string;
  bucketDays: number;
  inflows: number;
  outflows: number;
  netFlow: number;
  cumulativeGap: number;
  availableLiquidity: number;
}

export interface FundingConcentration {
  sourceType: string;
  sourceName: string;
  amount: number;
  percentOfTotal: number;
  maturityProfile: 'short' | 'medium' | 'long' | 'mixed';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ContingencyItem {
  id: string;
  category: string;
  item: string;
  status: 'ready' | 'partial' | 'not_ready';
  score: number;
  notes?: string;
  lastTested?: Date;
}

// ----------------------------------------------------------------------------
// Hedge Types
// ----------------------------------------------------------------------------

export interface Hedge {
  id: string;
  type: ProductType;
  description: string;
  notional: number;
  startDate: Date;
  maturityDate: Date;
  counterparty?: string;
  payLeg?: HedgeLeg;
  receiveLeg?: HedgeLeg;
  marketValue: number;
  dv01: number;
  effectiveness?: HedgeEffectiveness;
}

export interface HedgeLeg {
  rateType: 'fixed' | 'floating';
  rate?: number;
  index?: string;
  spread?: number;
  frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
}

export interface HedgeEffectiveness {
  designatedHedge: boolean;
  hedgeRatio: number;
  dollarOffsetRatio: number;
  regressionR2: number;
  effectivenessStatus: 'highly_effective' | 'effective' | 'ineffective';
}

export interface HedgeStrategy {
  id: string;
  name: string;
  description: string;
  targetMetric: 'NII' | 'EVE' | 'DOE' | 'DV01';
  proposedHedges: ProposedHedge[];
  projectedImpact: {
    beforeMetric: number;
    afterMetric: number;
    limitRelief: number;
    cost: number;
  };
}

export interface ProposedHedge {
  type: ProductType;
  notional: number;
  tenor: number; // months
  estimatedRate?: number;
  estimatedCost: number;
}

// ----------------------------------------------------------------------------
// Backtesting Types
// ----------------------------------------------------------------------------

export interface BacktestResult {
  id: string;
  metricType: 'NII' | 'EVE' | 'BETA' | 'DECAY' | 'NIM';
  periodStart: Date;
  periodEnd: Date;
  forecasts: ForecastPoint[];
  realized: ForecastPoint[];
  errorMetrics: ErrorMetrics;
  driftSignals: DriftSignal[];
}

export interface ForecastPoint {
  date: Date;
  value: number;
  scenarioId?: string;
  productId?: string;
}

export interface ErrorMetrics {
  meanError: number;
  meanAbsoluteError: number;
  rootMeanSquareError: number;
  meanPercentageError: number;
  bias: number;
  biasDirection: 'over' | 'under' | 'neutral';
  stability: 'stable' | 'moderate' | 'volatile';
}

export interface DriftSignal {
  id: string;
  detectedAt: Date;
  metric: string;
  segment?: string;
  product?: string;
  driftType: 'level_shift' | 'trend_change' | 'variance_change';
  magnitude: number;
  significance: 'high' | 'moderate' | 'low';
  recommendation: string;
}

// ----------------------------------------------------------------------------
// Report Types
// ----------------------------------------------------------------------------

export interface ALCOReport {
  id: string;
  generatedAt: Date;
  runId: string;
  priorRunId?: string;
  sections: ReportSection[];
  metadata: {
    generatedBy: string;
    demoMode: boolean;
    dataQualityScore: number;
    caveats: string[];
  };
}

export interface ReportSection {
  id: string;
  title: string;
  order: number;
  content: string;
  keyMetrics?: ReportMetric[];
}

export interface ReportMetric {
  label: string;
  value: number;
  unit: string;
  change?: number;
  changeDirection?: 'up' | 'down' | 'flat';
  status?: 'good' | 'warning' | 'bad';
}

// ----------------------------------------------------------------------------
// Filter & UI State Types
// ----------------------------------------------------------------------------

export interface GlobalFilters {
  runId: string;
  priorRunId?: string;
  scenarioSetId: string;
  selectedScenarios: string[];
  horizon: HorizonType;
  currency: string;
  institution?: string;
}

export interface ChartConfig {
  showLegend: boolean;
  showTooltips: boolean;
  showGrid: boolean;
  animate: boolean;
  height: number;
}
