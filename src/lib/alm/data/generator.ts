import seedrandom from 'seedrandom';
import { addDays, addMonths, subMonths, format } from 'date-fns';
import type {
  Run,
  ScenarioSet,
  Scenario,
  YieldCurve,
  CurvePoint,
  Position,
  ProductType,
  RiskMetrics,
  NIIResult,
  EVEResult,
  DurationMetrics,
  RepricingGap,
  LimitStatus,
  DepositProduct,
  BetaMetrics,
  DecayParameters,
  MacroSeries,
  AssumptionSet,
  AssumptionParam,
  Alert,
  LiquidityMetrics,
  CashflowBucket,
  FundingConcentration,
  ContingencyItem,
  Hedge,
  BacktestResult,
  HorizonType,
  DataWarning,
  EnhancedDepositBeta,
  LoanAssumptions,
  PrepaymentAssumptions,
  LoanPricingBeta,
  CreditAssumptions,
  RepricingAssumptions,
  AssumptionHistoryPoint,
  BasisRiskAssumptions,
  AssumptionLibrary,
  AssumptionCategory,
} from '../types';

// ============================================================================
// ALM Synthetic Data Generator
// ============================================================================

const TENOR_LABELS: { months: number; label: string }[] = [
  { months: 1, label: '1M' },
  { months: 3, label: '3M' },
  { months: 6, label: '6M' },
  { months: 12, label: '1Y' },
  { months: 24, label: '2Y' },
  { months: 36, label: '3Y' },
  { months: 60, label: '5Y' },
  { months: 84, label: '7Y' },
  { months: 120, label: '10Y' },
  { months: 240, label: '20Y' },
  { months: 360, label: '30Y' },
];

export class ALMDataGenerator {
  private seed: string;
  private rng: seedrandom.PRNG;
  private institutionId: string;
  private asOfDate: Date;

  constructor(seed: string = 'alm-demo-2024', institutionId: string = 'DEMO_BANK') {
    this.seed = seed;
    this.institutionId = institutionId;
    this.rng = seedrandom(seed + institutionId);
    this.asOfDate = new Date();
  }

  // ----------------------------------------------------------------------------
  // Random helpers
  // ----------------------------------------------------------------------------

  private random(): number {
    return this.rng();
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  private randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }

  private randomNormal(mean: number, stdDev: number): number {
    // Box-Muller transform
    const u1 = this.random();
    const u2 = this.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${this.randomInt(100000, 999999)}`;
  }

  // ----------------------------------------------------------------------------
  // Run Generation
  // ----------------------------------------------------------------------------

  generateRun(isCurrentRun: boolean = true): Run {
    const runDate = isCurrentRun ? this.asOfDate : subMonths(this.asOfDate, 1);

    const warnings: DataWarning[] = [];
    if (this.random() > 0.7) {
      warnings.push({
        id: this.generateId('warn'),
        severity: 'warning',
        category: 'data_quality',
        message: 'Some position data may be stale (>24h old)',
        affectedData: ['loans_commercial'],
      });
    }

    return {
      runId: this.generateId('run'),
      timestamp: runDate,
      label: isCurrentRun ? 'Current Month-End' : 'Prior Month-End',
      createdBy: 'ALM System',
      notes: isCurrentRun ? 'Monthly ALM production run' : 'Prior period comparison',
      scenarioSetId: 'ss_standard_2024',
      assumptionSetId: 'as_q4_2024',
      dataQualityScore: this.randomInt(85, 98),
      warnings,
      status: 'final',
    };
  }

  // ----------------------------------------------------------------------------
  // Scenario Generation
  // ----------------------------------------------------------------------------

  generateScenarioSet(): ScenarioSet {
    const scenarios: Scenario[] = [
      {
        scenarioId: 'base',
        name: 'Base Case',
        shortName: 'Base',
        tags: ['base'],
        narrative: 'Current forward curve with no additional shocks. Reflects market-implied path.',
        probability: 0.5,
        isBase: true,
      },
      {
        scenarioId: 'up_100',
        name: 'Parallel +100bp',
        shortName: '+100bp',
        tags: ['parallel_up'],
        narrative: 'Immediate parallel shift up 100 basis points across all tenors.',
        probability: 0.1,
        isBase: false,
      },
      {
        scenarioId: 'up_200',
        name: 'Parallel +200bp',
        shortName: '+200bp',
        tags: ['parallel_up', 'stress'],
        narrative: 'Immediate parallel shift up 200 basis points. Stress scenario.',
        probability: 0.05,
        isBase: false,
      },
      {
        scenarioId: 'down_100',
        name: 'Parallel -100bp',
        shortName: '-100bp',
        tags: ['parallel_down'],
        narrative: 'Immediate parallel shift down 100 basis points across all tenors.',
        probability: 0.1,
        isBase: false,
      },
      {
        scenarioId: 'down_200',
        name: 'Parallel -200bp',
        shortName: '-200bp',
        tags: ['parallel_down', 'stress'],
        narrative: 'Immediate parallel shift down 200 basis points. Stress scenario.',
        probability: 0.05,
        isBase: false,
      },
      {
        scenarioId: 'steepener',
        name: 'Bull Steepener',
        shortName: 'Steep',
        tags: ['steepener'],
        narrative: 'Short rates down 50bp, long rates up 50bp. Curve steepening.',
        probability: 0.08,
        isBase: false,
      },
      {
        scenarioId: 'flattener',
        name: 'Bear Flattener',
        shortName: 'Flat',
        tags: ['flattener'],
        narrative: 'Short rates up 75bp, long rates up 25bp. Curve flattening.',
        probability: 0.07,
        isBase: false,
      },
      {
        scenarioId: 'ramp_up',
        name: 'Gradual +200bp (12mo)',
        shortName: 'Ramp Up',
        tags: ['ramp_up'],
        narrative: 'Gradual increase of 200bp over 12 months, ~17bp per month.',
        probability: 0.05,
        isBase: false,
      },
    ];

    return {
      scenarioSetId: 'ss_standard_2024',
      name: 'Standard Rate Scenarios 2024',
      description: 'Regulatory and internal rate shock scenarios for IRR analysis',
      createdAt: subMonths(this.asOfDate, 6),
      scenarios,
    };
  }

  generateYieldCurves(scenarioSet: ScenarioSet): YieldCurve[] {
    const curves: YieldCurve[] = [];

    // Base curve - realistic current rates
    const baseRates = [5.25, 5.15, 5.05, 4.85, 4.55, 4.35, 4.15, 4.05, 4.00, 4.10, 4.25];

    for (const scenario of scenarioSet.scenarios) {
      const points: CurvePoint[] = TENOR_LABELS.map((tenor, idx) => {
        let rate = baseRates[idx] / 100;

        // Apply scenario-specific shifts
        if (scenario.scenarioId === 'up_100') {
          rate += 0.01;
        } else if (scenario.scenarioId === 'up_200') {
          rate += 0.02;
        } else if (scenario.scenarioId === 'down_100') {
          rate = Math.max(0.001, rate - 0.01);
        } else if (scenario.scenarioId === 'down_200') {
          rate = Math.max(0.001, rate - 0.02);
        } else if (scenario.scenarioId === 'steepener') {
          const factor = (tenor.months - 60) / 300; // -0.2 to +1.0
          rate += factor * 0.01;
        } else if (scenario.scenarioId === 'flattener') {
          const factor = (60 - tenor.months) / 300;
          rate += factor * 0.005 + 0.005;
        } else if (scenario.scenarioId === 'ramp_up') {
          rate += 0.02; // End state after 12mo ramp
        }

        return {
          tenorMonths: tenor.months,
          rate,
          tenorLabel: tenor.label,
        };
      });

      curves.push({
        curveId: this.generateId('curve'),
        scenarioId: scenario.scenarioId,
        asOfDate: this.asOfDate,
        currency: 'USD',
        curveType: 'spot',
        points,
      });
    }

    return curves;
  }

  // ----------------------------------------------------------------------------
  // Position Generation
  // ----------------------------------------------------------------------------

  generatePositions(): Position[] {
    const positions: Position[] = [];

    // Assets - Securities
    positions.push(
      this.createPosition('securities_fixed', 'asset', 'Treasury Securities', 850_000_000, 4.25, 'fixed', 5.2),
      this.createPosition('securities_fixed', 'asset', 'Agency MBS', 1_200_000_000, 4.75, 'fixed', 4.8, true),
      this.createPosition('securities_floating', 'asset', 'Floating Rate Notes', 350_000_000, 5.15, 'floating', 0.3),
    );

    // Assets - Loans
    positions.push(
      this.createPosition('loans_commercial', 'asset', 'C&I Loans - Fixed', 1_800_000_000, 6.25, 'fixed', 3.2),
      this.createPosition('loans_commercial', 'asset', 'C&I Loans - Floating', 1_400_000_000, 7.15, 'floating', 0.2),
      this.createPosition('loans_cre', 'asset', 'CRE Loans', 2_100_000_000, 6.75, 'fixed', 4.5),
      this.createPosition('loans_mortgage', 'asset', 'Residential Mortgages', 3_200_000_000, 5.85, 'fixed', 5.8, true),
      this.createPosition('loans_consumer', 'asset', 'Consumer Loans', 650_000_000, 8.25, 'fixed', 2.1),
    );

    // Liabilities - Deposits
    positions.push(
      this.createPosition('deposits_dda', 'liability', 'DDA - Consumer', -1_800_000_000, 0.05, 'floating', 0),
      this.createPosition('deposits_dda', 'liability', 'DDA - Commercial', -2_200_000_000, 0.10, 'floating', 0),
      this.createPosition('deposits_now', 'liability', 'NOW Accounts', -950_000_000, 0.25, 'floating', 0),
      this.createPosition('deposits_mmda', 'liability', 'MMDA - Retail', -2_400_000_000, 3.85, 'floating', 0),
      this.createPosition('deposits_mmda', 'liability', 'MMDA - Commercial', -1_600_000_000, 4.15, 'floating', 0),
      this.createPosition('deposits_savings', 'liability', 'Savings Accounts', -1_100_000_000, 0.45, 'floating', 0),
      this.createPosition('deposits_cd', 'liability', 'CDs < 1 Year', -1_200_000_000, 4.50, 'fixed', 0.5),
      this.createPosition('deposits_cd', 'liability', 'CDs 1-2 Year', -800_000_000, 4.25, 'fixed', 1.5),
    );

    // Liabilities - Borrowings
    positions.push(
      this.createPosition('borrowings_fhlb', 'liability', 'FHLB Advances', -1_500_000_000, 5.05, 'fixed', 2.0),
      this.createPosition('borrowings_repo', 'liability', 'Repo Borrowings', -400_000_000, 5.15, 'floating', 0.08),
    );

    // Derivatives
    positions.push(
      this.createPosition('swap_pay_fixed', 'derivative', 'Pay Fixed Swap 5Y', 500_000_000, 4.25, 'hybrid', 4.2),
      this.createPosition('swap_receive_fixed', 'derivative', 'Receive Fixed Swap 3Y', 300_000_000, 3.95, 'hybrid', 2.8),
      this.createPosition('cap', 'derivative', 'Interest Rate Cap', 200_000_000, 0, 'floating', 0),
    );

    return positions;
  }

  private createPosition(
    productType: ProductType,
    category: 'asset' | 'liability' | 'derivative',
    name: string,
    balance: number,
    coupon: number,
    rateType: 'fixed' | 'floating' | 'hybrid',
    duration: number,
    hasOptionality: boolean = false
  ): Position {
    return {
      id: this.generateId('pos'),
      category,
      productType,
      productName: name,
      segment: category === 'liability' && productType.startsWith('deposits') ? 'Core' : undefined,
      currency: 'USD',
      balance,
      coupon: coupon / 100,
      rateType,
      index: rateType === 'floating' ? 'SOFR' : undefined,
      spread: rateType === 'floating' ? this.randomFloat(0.01, 0.025) : undefined,
      nextRepriceDate: rateType === 'floating' ? addDays(this.asOfDate, this.randomInt(1, 90)) : undefined,
      maturityDate: addMonths(this.asOfDate, this.randomInt(12, 120)),
      hasOptionality,
      optionalityType: hasOptionality ? 'prepay' : undefined,
      duration,
      convexity: this.randomFloat(-0.5, 0.2),
    };
  }

  // ----------------------------------------------------------------------------
  // Risk Metrics Generation
  // ----------------------------------------------------------------------------

  generateRiskMetrics(runId: string, scenarioId: string, horizon: HorizonType = '12m'): RiskMetrics {
    const isStress = scenarioId.includes('200') || scenarioId === 'steepener';
    const isUp = scenarioId.includes('up') || scenarioId === 'flattener';
    const isDown = scenarioId.includes('down');

    // NII calculation - realistic values
    const baseNII = 485_000_000;
    let niiImpact = 0;

    if (isUp) {
      niiImpact = baseNII * this.randomFloat(0.03, 0.08) * (isStress ? 2 : 1);
    } else if (isDown) {
      niiImpact = -baseNII * this.randomFloat(0.04, 0.10) * (isStress ? 2 : 1);
    } else if (scenarioId === 'steepener') {
      niiImpact = baseNII * this.randomFloat(0.01, 0.03);
    }

    const nii: NIIResult = {
      baseNII,
      projectedNII: baseNII + niiImpact,
      impactAmount: niiImpact,
      impactPercent: (niiImpact / baseNII) * 100,
      impactBps: (niiImpact / baseNII) * 10000,
      nim: 3.25 + (niiImpact / baseNII) * 100 * 0.1,
      nimChange: (niiImpact / baseNII) * 100 * 0.1,
    };

    // EVE calculation
    const baseEVE = 1_850_000_000;
    let eveImpact = 0;

    if (isUp) {
      eveImpact = -baseEVE * this.randomFloat(0.05, 0.12) * (isStress ? 2 : 1);
    } else if (isDown) {
      eveImpact = baseEVE * this.randomFloat(0.04, 0.10) * (isStress ? 2 : 1);
    }

    const eve: EVEResult = {
      baseEVE,
      stressedEVE: baseEVE + eveImpact,
      impactAmount: eveImpact,
      impactPercent: (eveImpact / baseEVE) * 100,
      assetPV: 12_500_000_000,
      assetPVChange: eveImpact * 0.6,
      liabilityPV: 10_650_000_000,
      liabilityPVChange: eveImpact * 0.4,
      derivativePV: 25_000_000,
      derivativePVChange: eveImpact * 0.05,
    };

    const duration: DurationMetrics = {
      assetDuration: 4.2 + this.randomFloat(-0.3, 0.3),
      liabilityDuration: 1.8 + this.randomFloat(-0.2, 0.2),
      equityDuration: 6.5 + this.randomFloat(-0.5, 0.5),
      durationGap: 2.4 + this.randomFloat(-0.2, 0.2),
      dv01: 1_250_000 + this.randomInt(-100000, 100000),
      convexity: -0.15 + this.randomFloat(-0.05, 0.05),
    };

    const repricing = this.generateRepricingGaps();
    const limits = this.generateLimitStatuses(nii, eve, duration);

    return {
      runId,
      scenarioId,
      horizon,
      asOfDate: this.asOfDate,
      nii,
      eve,
      duration,
      repricing,
      limits,
    };
  }

  private generateRepricingGaps(): RepricingGap[] {
    const buckets = [
      { bucket: '0-30 days', start: 0, end: 30 },
      { bucket: '31-90 days', start: 31, end: 90 },
      { bucket: '91-180 days', start: 91, end: 180 },
      { bucket: '181-365 days', start: 181, end: 365 },
      { bucket: '1-2 years', start: 366, end: 730 },
      { bucket: '2-3 years', start: 731, end: 1095 },
      { bucket: '3-5 years', start: 1096, end: 1825 },
      { bucket: '5+ years', start: 1826, end: 9999 },
    ];

    let cumulativeGap = 0;
    return buckets.map((b, idx) => {
      const assets = this.randomFloat(800, 2500) * 1_000_000;
      const liabilities = this.randomFloat(700, 2800) * 1_000_000 * (idx < 3 ? 1.2 : 0.8);
      const gap = assets - liabilities;
      cumulativeGap += gap;

      return {
        bucket: b.bucket,
        bucketStart: b.start,
        bucketEnd: b.end,
        assets,
        liabilities,
        gap,
        cumulativeGap,
        gapRatio: gap / assets,
      };
    });
  }

  private generateLimitStatuses(nii: NIIResult, eve: EVEResult, duration: DurationMetrics): LimitStatus[] {
    return [
      {
        limitId: 'limit_eve_200up',
        limitName: 'EVE +200bp Sensitivity',
        metric: 'EVE_CHANGE',
        currentValue: Math.abs(eve.impactPercent),
        warningThreshold: 10,
        criticalThreshold: 15,
        status: Math.abs(eve.impactPercent) > 15 ? 'breach' : Math.abs(eve.impactPercent) > 10 ? 'warning' : 'ok',
        utilizationPercent: (Math.abs(eve.impactPercent) / 15) * 100,
        trend: this.randomChoice(['improving', 'stable', 'deteriorating']),
      },
      {
        limitId: 'limit_nii_12m',
        limitName: 'NII@Risk 12-Month',
        metric: 'NII_CHANGE',
        currentValue: Math.abs(nii.impactPercent),
        warningThreshold: 8,
        criticalThreshold: 12,
        status: Math.abs(nii.impactPercent) > 12 ? 'breach' : Math.abs(nii.impactPercent) > 8 ? 'warning' : 'ok',
        utilizationPercent: (Math.abs(nii.impactPercent) / 12) * 100,
        trend: 'stable',
      },
      {
        limitId: 'limit_doe',
        limitName: 'Duration of Equity',
        metric: 'DOE',
        currentValue: Math.abs(duration.equityDuration),
        warningThreshold: 7,
        criticalThreshold: 10,
        status: Math.abs(duration.equityDuration) > 10 ? 'breach' : Math.abs(duration.equityDuration) > 7 ? 'warning' : 'ok',
        utilizationPercent: (Math.abs(duration.equityDuration) / 10) * 100,
        trend: 'stable',
      },
      {
        limitId: 'limit_dv01',
        limitName: 'DV01 Limit',
        metric: 'DV01',
        currentValue: duration.dv01,
        warningThreshold: 1_500_000,
        criticalThreshold: 2_000_000,
        status: duration.dv01 > 2_000_000 ? 'breach' : duration.dv01 > 1_500_000 ? 'warning' : 'ok',
        utilizationPercent: (duration.dv01 / 2_000_000) * 100,
        trend: 'improving',
      },
    ];
  }

  // ----------------------------------------------------------------------------
  // Deposit Products Generation
  // ----------------------------------------------------------------------------

  generateDepositProducts(): DepositProduct[] {
    const products: DepositProduct[] = [];

    const depositTypes: { type: ProductType; name: string; avgBeta: number; decay: number }[] = [
      { type: 'deposits_dda', name: 'DDA - Consumer', avgBeta: 0.15, decay: 0.02 },
      { type: 'deposits_dda', name: 'DDA - Commercial', avgBeta: 0.25, decay: 0.03 },
      { type: 'deposits_now', name: 'NOW Accounts', avgBeta: 0.20, decay: 0.025 },
      { type: 'deposits_mmda', name: 'MMDA - Retail', avgBeta: 0.65, decay: 0.04 },
      { type: 'deposits_mmda', name: 'MMDA - Commercial', avgBeta: 0.75, decay: 0.06 },
      { type: 'deposits_savings', name: 'Savings Accounts', avgBeta: 0.35, decay: 0.03 },
      { type: 'deposits_cd', name: 'CD < 1 Year', avgBeta: 0.90, decay: 0.15 },
    ];

    for (const dt of depositTypes) {
      const beta = this.generateBetaMetrics(dt.avgBeta);
      const decay = this.generateDecayParameters(dt.decay);

      products.push({
        productId: this.generateId('dep'),
        productType: dt.type,
        productName: dt.name,
        segment: dt.name.includes('Commercial') ? 'Commercial' : 'Retail',
        balance: this.randomFloat(500, 2500) * 1_000_000,
        observedRates: this.generateRateSeries(24, 0.001, 0.045),
        modeledRates: this.generateRateSeries(24, 0.001, 0.042),
        beta,
        decay,
        effectiveMaturity: Math.round(decay.assumedMaturity),
      });
    }

    return products;
  }

  private generateBetaMetrics(avgBeta: number): BetaMetrics {
    const levelBeta = avgBeta + this.randomFloat(-0.1, 0.1);
    return {
      levelBeta: Math.max(0, Math.min(1.5, levelBeta)),
      passThroughSlope: levelBeta * this.randomFloat(0.85, 1.15),
      timeVaryingBeta: Array.from({ length: 24 }, () =>
        Math.max(0, levelBeta + this.randomNormal(0, 0.05))
      ),
      confidenceInterval: {
        lower: Math.max(0, levelBeta - 0.15),
        upper: Math.min(1.5, levelBeta + 0.15),
      },
      rSquared: this.randomFloat(0.7, 0.95),
      stability: levelBeta > 0.5 ? 'moderate' : 'stable',
      lastUpdated: subMonths(this.asOfDate, 1),
    };
  }

  private generateDecayParameters(baseDecay: number): DecayParameters {
    const decayRate = baseDecay + this.randomFloat(-0.01, 0.01);
    const halfLife = Math.log(2) / decayRate * 12;

    return {
      modelType: 'exponential',
      decayRate,
      halfLife,
      survivalCurve: Array.from({ length: 61 }, (_, month) => ({
        month,
        survivalRate: Math.exp(-decayRate * month / 12),
        confidence: 0.95 - month * 0.005,
      })),
      assumedMaturity: halfLife * 1.5,
      realizedMaturity: halfLife * 1.5 * this.randomFloat(0.85, 1.15),
    };
  }

  private generateRateSeries(months: number, minRate: number, maxRate: number): { date: Date; rate: number }[] {
    const series: { date: Date; rate: number }[] = [];
    let currentRate = this.randomFloat(minRate, maxRate * 0.3);

    for (let i = months; i >= 0; i--) {
      const date = subMonths(this.asOfDate, i);
      // Simulate rate rising cycle
      const trendFactor = (months - i) / months;
      currentRate = minRate + (maxRate - minRate) * trendFactor + this.randomNormal(0, 0.002);
      series.push({ date, rate: Math.max(minRate, Math.min(maxRate, currentRate)) });
    }

    return series;
  }

  // ----------------------------------------------------------------------------
  // Macro Series Generation
  // ----------------------------------------------------------------------------

  generateMacroSeries(): MacroSeries[] {
    return [
      this.createMacroSeries('fed_funds', 'Federal Funds Rate', 'Fed Funds', '%', 0, 5.5),
      this.createMacroSeries('sofr', 'SOFR', 'SOFR', '%', 0, 5.4),
      this.createMacroSeries('treasury_10y', '10-Year Treasury', '10Y TSY', '%', 3.5, 5.0),
      this.createMacroSeries('unemployment', 'Unemployment Rate', 'Unemp', '%', 3.5, 4.5),
      this.createMacroSeries('cpi', 'CPI YoY', 'CPI', '%', 2.5, 4.0),
      this.createMacroSeries('gdp_growth', 'GDP Growth', 'GDP', '%', 1.5, 3.5),
      this.createMacroSeries('housing_starts', 'Housing Starts', 'Housing', 'K units', 1200, 1600),
    ];
  }

  private createMacroSeries(
    id: string,
    name: string,
    shortName: string,
    units: string,
    minVal: number,
    maxVal: number
  ): MacroSeries {
    const points: { date: Date; value: number }[] = [];
    let value = this.randomFloat(minVal, (minVal + maxVal) / 2);

    for (let i = 36; i >= 0; i--) {
      const date = subMonths(this.asOfDate, i);
      value = value + this.randomNormal(0, (maxVal - minVal) * 0.02);
      value = Math.max(minVal, Math.min(maxVal, value));
      points.push({ date, value });
    }

    return {
      id,
      name,
      shortName,
      units,
      frequency: 'monthly',
      points,
      source: 'Federal Reserve / BLS',
    };
  }

  // ----------------------------------------------------------------------------
  // Assumptions Generation
  // ----------------------------------------------------------------------------

  generateAssumptionSet(version: number = 1, status: 'draft' | 'review' | 'approved' = 'approved'): AssumptionSet {
    const parameters: AssumptionParam[] = [
      {
        key: 'beta_dda_consumer',
        label: 'DDA Consumer Beta',
        category: 'beta',
        value: 0.15,
        unit: 'ratio',
        scope: 'product',
        productFilter: 'deposits_dda',
        rationale: 'Based on 5-year regression analysis of rate sensitivity',
        evidenceRefs: ['Beta Study Q3 2024', 'Peer Analysis Report'],
        sensitivity: 'high',
        lastBacktested: subMonths(this.asOfDate, 3),
      },
      {
        key: 'beta_mmda_retail',
        label: 'MMDA Retail Beta',
        category: 'beta',
        value: 0.65,
        unit: 'ratio',
        scope: 'product',
        productFilter: 'deposits_mmda',
        rationale: 'Higher sensitivity due to rate-competitive product positioning',
        evidenceRefs: ['Beta Study Q3 2024'],
        sensitivity: 'high',
        lastBacktested: subMonths(this.asOfDate, 3),
      },
      {
        key: 'decay_dda_halflife',
        label: 'DDA Half-Life',
        category: 'decay',
        value: 84,
        unit: 'months',
        scope: 'product',
        productFilter: 'deposits_dda',
        rationale: 'Core deposit study indicates 7-year half-life',
        evidenceRefs: ['Core Deposit Study 2024'],
        sensitivity: 'medium',
      },
      {
        key: 'prepay_mortgage_base',
        label: 'Mortgage Prepay CPR - Base',
        category: 'prepayment',
        value: 8.5,
        unit: '%',
        scope: 'product',
        productFilter: 'loans_mortgage',
        rationale: 'Historical CPR average adjusted for rate environment',
        evidenceRefs: ['Prepayment Model Documentation'],
        sensitivity: 'high',
      },
      {
        key: 'growth_deposits_annual',
        label: 'Annual Deposit Growth',
        category: 'growth',
        value: 3.5,
        unit: '%',
        scope: 'portfolio',
        rationale: 'Budget forecast for deposit growth',
        evidenceRefs: ['2024 Budget', 'Strategic Plan'],
        sensitivity: 'low',
      },
    ];

    return {
      id: this.generateId('aset'),
      name: `Q${Math.ceil((this.asOfDate.getMonth() + 1) / 3)} ${this.asOfDate.getFullYear()} Assumptions`,
      version,
      status,
      owner: 'Treasury Analytics',
      effectiveDate: this.asOfDate,
      createdAt: subMonths(this.asOfDate, 1),
      updatedAt: this.asOfDate,
      approvedAt: status === 'approved' ? subMonths(this.asOfDate, 0.5) : undefined,
      approvedBy: status === 'approved' ? 'ALCO Committee' : undefined,
      approvals: status === 'approved' ? [
        {
          approver: 'CFO',
          role: 'Chief Financial Officer',
          timestamp: subMonths(this.asOfDate, 0.5),
          decision: 'approved',
          comments: 'Approved pending Q4 backtest review',
        },
      ] : [],
      comments: [],
      parameters,
    };
  }

  // ----------------------------------------------------------------------------
  // Alerts Generation
  // ----------------------------------------------------------------------------

  generateAlerts(metrics: RiskMetrics): Alert[] {
    const alerts: Alert[] = [];

    // Check limit statuses for breaches/warnings
    for (const limit of metrics.limits) {
      if (limit.status === 'breach') {
        alerts.push({
          id: this.generateId('alert'),
          severity: 'critical',
          type: 'limit_breach',
          title: `${limit.limitName} Limit Breach`,
          description: `Current value of ${limit.currentValue.toFixed(2)} exceeds critical threshold of ${limit.criticalThreshold}`,
          metric: limit.metric,
          currentValue: limit.currentValue,
          threshold: limit.criticalThreshold,
          createdAt: this.asOfDate,
          linkedModule: 'scenarios',
          linkedFilters: { metric: limit.metric },
        });
      } else if (limit.status === 'warning') {
        alerts.push({
          id: this.generateId('alert'),
          severity: 'warning',
          type: 'limit_warning',
          title: `${limit.limitName} Approaching Limit`,
          description: `Current value of ${limit.currentValue.toFixed(2)} exceeds warning threshold of ${limit.warningThreshold}`,
          metric: limit.metric,
          currentValue: limit.currentValue,
          threshold: limit.warningThreshold,
          createdAt: this.asOfDate,
          linkedModule: 'scenarios',
        });
      }
    }

    // Random additional alerts
    if (this.random() > 0.6) {
      alerts.push({
        id: this.generateId('alert'),
        severity: 'info',
        type: 'assumption_change',
        title: 'Deposit Beta Assumptions Updated',
        description: 'MMDA retail beta increased from 0.60 to 0.65 based on recent regression',
        createdAt: subMonths(this.asOfDate, 0.1),
        linkedModule: 'assumptions',
      });
    }

    return alerts;
  }

  // ----------------------------------------------------------------------------
  // Liquidity Metrics Generation
  // ----------------------------------------------------------------------------

  generateLiquidityMetrics(runId: string): LiquidityMetrics {
    const cashflowLadder: CashflowBucket[] = [
      { bucket: '1 Day', bucketDays: 1, inflows: 125_000_000, outflows: 95_000_000, netFlow: 30_000_000, cumulativeGap: 30_000_000, availableLiquidity: 850_000_000 },
      { bucket: '2-7 Days', bucketDays: 7, inflows: 280_000_000, outflows: 220_000_000, netFlow: 60_000_000, cumulativeGap: 90_000_000, availableLiquidity: 910_000_000 },
      { bucket: '8-30 Days', bucketDays: 30, inflows: 450_000_000, outflows: 520_000_000, netFlow: -70_000_000, cumulativeGap: 20_000_000, availableLiquidity: 840_000_000 },
      { bucket: '31-90 Days', bucketDays: 90, inflows: 680_000_000, outflows: 750_000_000, netFlow: -70_000_000, cumulativeGap: -50_000_000, availableLiquidity: 770_000_000 },
      { bucket: '91-180 Days', bucketDays: 180, inflows: 920_000_000, outflows: 850_000_000, netFlow: 70_000_000, cumulativeGap: 20_000_000, availableLiquidity: 840_000_000 },
      { bucket: '181-365 Days', bucketDays: 365, inflows: 1_200_000_000, outflows: 1_100_000_000, netFlow: 100_000_000, cumulativeGap: 120_000_000, availableLiquidity: 940_000_000 },
    ];

    const fundingConcentrations: FundingConcentration[] = [
      { sourceType: 'Deposits', sourceName: 'Core Deposits', amount: 8_500_000_000, percentOfTotal: 62, maturityProfile: 'long', riskLevel: 'low' },
      { sourceType: 'Deposits', sourceName: 'Brokered CDs', amount: 850_000_000, percentOfTotal: 6, maturityProfile: 'short', riskLevel: 'high' },
      { sourceType: 'Borrowings', sourceName: 'FHLB Advances', amount: 1_500_000_000, percentOfTotal: 11, maturityProfile: 'medium', riskLevel: 'low' },
      { sourceType: 'Borrowings', sourceName: 'Fed Funds', amount: 200_000_000, percentOfTotal: 1.5, maturityProfile: 'short', riskLevel: 'medium' },
      { sourceType: 'Capital', sourceName: 'Equity', amount: 1_850_000_000, percentOfTotal: 13.5, maturityProfile: 'long', riskLevel: 'low' },
      { sourceType: 'Other', sourceName: 'Other Liabilities', amount: 800_000_000, percentOfTotal: 6, maturityProfile: 'mixed', riskLevel: 'medium' },
    ];

    const contingencyReadiness: ContingencyItem[] = [
      { id: 'c1', category: 'Liquidity Sources', item: 'FHLB borrowing capacity documented', status: 'ready', score: 100, lastTested: subMonths(this.asOfDate, 1) },
      { id: 'c2', category: 'Liquidity Sources', item: 'Fed Discount Window access tested', status: 'ready', score: 100, lastTested: subMonths(this.asOfDate, 2) },
      { id: 'c3', category: 'Liquidity Sources', item: 'Repo counterparties documented', status: 'partial', score: 75, notes: 'Need to update one counterparty agreement' },
      { id: 'c4', category: 'Asset Sales', item: 'Securities available for sale identified', status: 'ready', score: 100 },
      { id: 'c5', category: 'Communication', item: 'Stakeholder communication plan', status: 'ready', score: 90 },
      { id: 'c6', category: 'Operations', item: 'Liquidity stress drill conducted', status: 'partial', score: 60, notes: 'Last drill was 8 months ago', lastTested: subMonths(this.asOfDate, 8) },
    ];

    return {
      runId,
      asOfDate: this.asOfDate,
      survivalHorizon: 95,
      survivalHorizonTarget: 90,
      cashflowLadder,
      fundingConcentrations,
      contingencyReadiness,
      overallScore: 82,
    };
  }

  // ----------------------------------------------------------------------------
  // Hedge Generation
  // ----------------------------------------------------------------------------

  generateHedges(): Hedge[] {
    return [
      {
        id: this.generateId('hedge'),
        type: 'swap_pay_fixed',
        description: 'Pay Fixed 5Y Swap - Asset Duration Hedge',
        notional: 500_000_000,
        startDate: subMonths(this.asOfDate, 18),
        maturityDate: addMonths(this.asOfDate, 42),
        counterparty: 'JPMorgan',
        payLeg: { rateType: 'fixed', rate: 0.0425, frequency: 'semiannual' },
        receiveLeg: { rateType: 'floating', index: 'SOFR', spread: 0, frequency: 'quarterly' },
        marketValue: 12_500_000,
        dv01: 425_000,
        effectiveness: {
          designatedHedge: true,
          hedgeRatio: 0.95,
          dollarOffsetRatio: 0.92,
          regressionR2: 0.94,
          effectivenessStatus: 'highly_effective',
        },
      },
      {
        id: this.generateId('hedge'),
        type: 'swap_receive_fixed',
        description: 'Receive Fixed 3Y Swap - Liability Hedge',
        notional: 300_000_000,
        startDate: subMonths(this.asOfDate, 6),
        maturityDate: addMonths(this.asOfDate, 30),
        counterparty: 'Bank of America',
        payLeg: { rateType: 'floating', index: 'SOFR', spread: 0.001, frequency: 'quarterly' },
        receiveLeg: { rateType: 'fixed', rate: 0.0395, frequency: 'semiannual' },
        marketValue: -5_200_000,
        dv01: 185_000,
        effectiveness: {
          designatedHedge: true,
          hedgeRatio: 0.88,
          dollarOffsetRatio: 0.85,
          regressionR2: 0.89,
          effectivenessStatus: 'effective',
        },
      },
      {
        id: this.generateId('hedge'),
        type: 'cap',
        description: '5Y Interest Rate Cap - Downside Protection',
        notional: 200_000_000,
        startDate: subMonths(this.asOfDate, 12),
        maturityDate: addMonths(this.asOfDate, 48),
        counterparty: 'Citi',
        marketValue: 3_800_000,
        dv01: 45_000,
      },
    ];
  }

  // ----------------------------------------------------------------------------
  // Backtest Results Generation
  // ----------------------------------------------------------------------------

  generateBacktestResults(): BacktestResult[] {
    const results: BacktestResult[] = [];

    // NII Backtest
    const niiForecasts: { date: Date; value: number }[] = [];
    const niiRealized: { date: Date; value: number }[] = [];
    let forecast = 485_000_000;
    let realized = 485_000_000;

    for (let i = 12; i >= 0; i--) {
      const date = subMonths(this.asOfDate, i);
      forecast += this.randomNormal(2_000_000, 3_000_000);
      realized = forecast * this.randomFloat(0.97, 1.03);
      niiForecasts.push({ date, value: forecast });
      niiRealized.push({ date, value: realized });
    }

    results.push({
      id: this.generateId('bt'),
      metricType: 'NII',
      periodStart: subMonths(this.asOfDate, 12),
      periodEnd: this.asOfDate,
      forecasts: niiForecasts,
      realized: niiRealized,
      errorMetrics: {
        meanError: this.randomFloat(-5_000_000, 5_000_000),
        meanAbsoluteError: this.randomFloat(3_000_000, 8_000_000),
        rootMeanSquareError: this.randomFloat(4_000_000, 10_000_000),
        meanPercentageError: this.randomFloat(-2, 2),
        bias: this.randomFloat(-0.5, 0.5),
        biasDirection: 'neutral',
        stability: 'stable',
      },
      driftSignals: [],
    });

    // Beta Backtest
    const betaForecasts: { date: Date; value: number; productId: string }[] = [];
    const betaRealized: { date: Date; value: number; productId: string }[] = [];
    let betaForecast = 0.65;

    for (let i = 12; i >= 0; i--) {
      const date = subMonths(this.asOfDate, i);
      betaForecast = 0.65 + this.randomNormal(0, 0.02);
      const betaReal = betaForecast + this.randomNormal(0, 0.05);
      betaForecasts.push({ date, value: betaForecast, productId: 'mmda_retail' });
      betaRealized.push({ date, value: betaReal, productId: 'mmda_retail' });
    }

    results.push({
      id: this.generateId('bt'),
      metricType: 'BETA',
      periodStart: subMonths(this.asOfDate, 12),
      periodEnd: this.asOfDate,
      forecasts: betaForecasts,
      realized: betaRealized,
      errorMetrics: {
        meanError: this.randomFloat(-0.05, 0.05),
        meanAbsoluteError: this.randomFloat(0.03, 0.08),
        rootMeanSquareError: this.randomFloat(0.04, 0.10),
        meanPercentageError: this.randomFloat(-5, 5),
        bias: this.randomFloat(-0.02, 0.02),
        biasDirection: 'neutral',
        stability: 'moderate',
      },
      driftSignals: this.random() > 0.7 ? [{
        id: this.generateId('drift'),
        detectedAt: subMonths(this.asOfDate, 2),
        metric: 'BETA',
        product: 'mmda_retail',
        driftType: 'level_shift',
        magnitude: 0.08,
        significance: 'moderate',
        recommendation: 'Consider recalibrating MMDA beta model with recent data',
      }] : [],
    });

    return results;
  }

  // ----------------------------------------------------------------------------
  // Enhanced Deposit Betas Generation
  // ----------------------------------------------------------------------------

  generateEnhancedDepositBetas(): EnhancedDepositBeta[] {
    const depositTypes: { type: ProductType; name: string; segment: string; avgBeta: number; balance: number }[] = [
      { type: 'deposits_dda', name: 'DDA - Consumer', segment: 'Retail', avgBeta: 0.12, balance: 1_800_000_000 },
      { type: 'deposits_dda', name: 'DDA - Commercial', segment: 'Commercial', avgBeta: 0.22, balance: 2_200_000_000 },
      { type: 'deposits_now', name: 'NOW Accounts', segment: 'Retail', avgBeta: 0.18, balance: 950_000_000 },
      { type: 'deposits_mmda', name: 'MMDA - Retail', segment: 'Retail', avgBeta: 0.62, balance: 2_400_000_000 },
      { type: 'deposits_mmda', name: 'MMDA - Commercial', segment: 'Commercial', avgBeta: 0.72, balance: 1_600_000_000 },
      { type: 'deposits_savings', name: 'Savings Accounts', segment: 'Retail', avgBeta: 0.32, balance: 1_100_000_000 },
      { type: 'deposits_cd', name: 'CD < 1 Year', segment: 'Retail', avgBeta: 0.88, balance: 1_200_000_000 },
      { type: 'deposits_cd', name: 'CD 1-2 Year', segment: 'Retail', avgBeta: 0.82, balance: 800_000_000 },
    ];

    return depositTypes.map(dt => {
      const levelBeta = dt.avgBeta + this.randomFloat(-0.08, 0.08);
      const upBeta = levelBeta * this.randomFloat(1.05, 1.20);
      const downBeta = levelBeta * this.randomFloat(0.70, 0.90);

      // Generate historical beta with realistic pattern
      const historicalBeta: { date: Date; value: number; marketRate: number; productRate: number }[] = [];
      let marketRate = 0.25;
      let productRate = dt.type === 'deposits_cd' ? 0.5 : 0.1;

      for (let i = 36; i >= 0; i--) {
        const date = subMonths(this.asOfDate, i);
        // Simulate rate rising cycle
        if (i > 24) {
          marketRate += this.randomFloat(0, 0.05);
        } else if (i > 12) {
          marketRate += this.randomFloat(0.1, 0.25);
        } else {
          marketRate += this.randomFloat(-0.05, 0.10);
        }
        marketRate = Math.max(0.25, Math.min(5.5, marketRate));

        // Product rate follows with beta
        const targetRate = productRate + (marketRate - (i === 36 ? 0.25 : historicalBeta[historicalBeta.length - 1]?.marketRate || 0.25)) * levelBeta;
        productRate = productRate * 0.7 + targetRate * 0.3 + this.randomNormal(0, 0.02);
        productRate = Math.max(0, productRate);

        const periodBeta = i === 36 ? levelBeta : (productRate - historicalBeta[historicalBeta.length - 1]?.productRate || 0) /
          Math.max(0.01, marketRate - (historicalBeta[historicalBeta.length - 1]?.marketRate || 0.25));

        historicalBeta.push({
          date,
          value: Math.max(0, Math.min(1.5, levelBeta + this.randomNormal(0, 0.05))),
          marketRate,
          productRate,
        });
      }

      return {
        productId: this.generateId('dbeta'),
        productName: dt.name,
        productType: dt.type,
        segment: dt.segment,
        balance: dt.balance,

        levelBeta: Math.max(0, Math.min(1.2, levelBeta)),
        cumulativeBeta: levelBeta * this.randomFloat(0.85, 1.0),
        incrementalBeta: levelBeta * this.randomFloat(0.9, 1.15),

        upBeta: Math.max(0, Math.min(1.5, upBeta)),
        downBeta: Math.max(0, Math.min(1.2, downBeta)),
        asymmetryRatio: upBeta / Math.max(0.01, downBeta),

        lagMonths: dt.type.includes('cd') ? 0 : this.randomInt(1, 3),
        lagDistribution: [0.4, 0.35, 0.15, 0.07, 0.03],

        rSquared: this.randomFloat(0.72, 0.96),
        standardError: this.randomFloat(0.02, 0.08),
        confidenceInterval: {
          lower: Math.max(0, levelBeta - 0.12),
          upper: Math.min(1.5, levelBeta + 0.12),
        },
        sampleSize: this.randomInt(36, 60),
        stability: levelBeta > 0.5 ? 'moderate' : 'stable',

        historicalBeta,

        peerBetaAvg: levelBeta * this.randomFloat(0.9, 1.1),
        peerBetaRange: {
          min: levelBeta * 0.7,
          max: levelBeta * 1.3,
        },

        modelType: 'regression',
        lastCalibrated: subMonths(this.asOfDate, this.randomInt(1, 3)),
        nextReviewDate: addMonths(this.asOfDate, this.randomInt(1, 6)),
      };
    });
  }

  // ----------------------------------------------------------------------------
  // Loan Assumptions Generation
  // ----------------------------------------------------------------------------

  generateLoanAssumptions(): LoanAssumptions[] {
    const loanTypes: { type: ProductType; name: string; segment: string; cpr: number; beta: number; loss: number; balance: number }[] = [
      { type: 'loans_mortgage', name: 'Residential Mortgages - 30Y Fixed', segment: 'Retail', cpr: 8.5, beta: 0.0, loss: 0.15, balance: 2_400_000_000 },
      { type: 'loans_mortgage', name: 'Residential Mortgages - 15Y Fixed', segment: 'Retail', cpr: 12.0, beta: 0.0, loss: 0.10, balance: 800_000_000 },
      { type: 'loans_mortgage', name: 'Residential Mortgages - ARM', segment: 'Retail', cpr: 15.0, beta: 0.85, loss: 0.20, balance: 450_000_000 },
      { type: 'loans_commercial', name: 'C&I Loans - Fixed Rate', segment: 'Commercial', cpr: 5.0, beta: 0.0, loss: 0.45, balance: 1_800_000_000 },
      { type: 'loans_commercial', name: 'C&I Loans - Floating Rate', segment: 'Commercial', cpr: 8.0, beta: 0.95, loss: 0.50, balance: 1_400_000_000 },
      { type: 'loans_cre', name: 'CRE - Multifamily', segment: 'Commercial', cpr: 6.0, beta: 0.0, loss: 0.35, balance: 1_200_000_000 },
      { type: 'loans_cre', name: 'CRE - Office', segment: 'Commercial', cpr: 4.0, beta: 0.0, loss: 0.85, balance: 600_000_000 },
      { type: 'loans_cre', name: 'CRE - Retail', segment: 'Commercial', cpr: 5.0, beta: 0.0, loss: 0.65, balance: 300_000_000 },
      { type: 'loans_consumer', name: 'Auto Loans', segment: 'Retail', cpr: 18.0, beta: 0.0, loss: 1.20, balance: 400_000_000 },
      { type: 'loans_consumer', name: 'Personal Loans', segment: 'Retail', cpr: 25.0, beta: 0.0, loss: 2.50, balance: 250_000_000 },
    ];

    return loanTypes.map(lt => {
      const baselineCPR = lt.cpr + this.randomFloat(-1.5, 1.5);

      // Generate historical CPR
      const historicalCPR: { date: Date; value: number }[] = [];
      for (let i = 24; i >= 0; i--) {
        historicalCPR.push({
          date: subMonths(this.asOfDate, i),
          value: baselineCPR + this.randomNormal(0, lt.cpr * 0.15),
        });
      }

      // Generate historical beta for floating rate loans
      const historicalBeta: { date: Date; value: number }[] = [];
      for (let i = 24; i >= 0; i--) {
        historicalBeta.push({
          date: subMonths(this.asOfDate, i),
          value: lt.beta + this.randomNormal(0, 0.03),
        });
      }

      // Generate historical loss
      const historicalLoss: { date: Date; value: number }[] = [];
      for (let i = 24; i >= 0; i--) {
        historicalLoss.push({
          date: subMonths(this.asOfDate, i),
          value: Math.max(0, lt.loss + this.randomNormal(0, lt.loss * 0.2)),
        });
      }

      const prepayment: PrepaymentAssumptions = {
        baselineCPR,
        incentiveCPR: lt.type === 'loans_mortgage' ? baselineCPR * 2.5 : baselineCPR * 1.2,
        seasonalityAdjustment: [0.85, 0.88, 0.95, 1.05, 1.12, 1.15, 1.18, 1.12, 1.05, 0.98, 0.92, 0.88],
        burnoutFactor: lt.type === 'loans_mortgage' ? 0.65 : 0.80,
        refiThreshold: lt.type === 'loans_mortgage' ? 50 : 100,
        modelType: lt.type === 'loans_mortgage' ? 'PSA' : 'CPR',
        psaMultiple: lt.type === 'loans_mortgage' ? 150 : undefined,
        historicalCPR,
      };

      const pricingBeta: LoanPricingBeta = {
        indexType: lt.beta > 0 ? 'SOFR' : 'Treasury',
        levelBeta: lt.beta,
        spreadBeta: lt.beta > 0 ? this.randomFloat(0.02, 0.08) : 0,
        lagMonths: lt.beta > 0 ? this.randomInt(0, 1) : 0,
        floor: lt.beta > 0 ? this.randomFloat(0.03, 0.045) : undefined,
        cap: lt.beta > 0 ? this.randomFloat(0.08, 0.12) : undefined,
        rSquared: lt.beta > 0 ? this.randomFloat(0.92, 0.99) : 1.0,
        stability: 'stable',
        historicalBeta,
      };

      const creditAssumptions: CreditAssumptions = {
        expectedLossRate: lt.loss,
        pdRate: lt.loss * this.randomFloat(1.5, 2.5),
        lgdRate: lt.loss / (lt.loss * this.randomFloat(1.5, 2.5)) * 100,
        stressMultiplier: this.randomFloat(2.0, 3.5),
        historicalLoss,
      };

      const repricingAssumptions: RepricingAssumptions = {
        repricingFrequency: lt.beta > 0 ? 'monthly' : 'at_maturity',
        indexLag: lt.beta > 0 ? this.randomInt(0, 5) : 0,
        basisSpread: lt.beta > 0 ? this.randomInt(150, 350) : 0,
        compoundingMethod: 'simple',
      };

      // Generate historical values
      const historicalValues: AssumptionHistoryPoint[] = [];
      const categories: AssumptionCategory[] = ['prepayment', 'loan_beta', 'credit'];
      for (let i = 12; i >= 0; i--) {
        for (const category of categories) {
          historicalValues.push({
            asOfDate: subMonths(this.asOfDate, i),
            category,
            parameterKey: `${lt.name.toLowerCase().replace(/\s+/g, '_')}_${category}`,
            parameterLabel: `${lt.name} ${category}`,
            value: category === 'prepayment' ? baselineCPR + this.randomNormal(0, 0.5) :
                   category === 'loan_beta' ? lt.beta + this.randomNormal(0, 0.02) :
                   lt.loss + this.randomNormal(0, lt.loss * 0.1),
            priorValue: i === 12 ? undefined : historicalValues[historicalValues.length - 3]?.value,
          });
        }
      }

      return {
        productId: this.generateId('loan'),
        productType: lt.type,
        productName: lt.name,
        segment: lt.segment,
        balance: lt.balance,
        prepayment,
        pricingBeta,
        creditAssumptions,
        repricingAssumptions,
        historicalValues,
      };
    });
  }

  // ----------------------------------------------------------------------------
  // Basis Risk Assumptions Generation
  // ----------------------------------------------------------------------------

  generateBasisRiskAssumptions(): BasisRiskAssumptions[] {
    const basisPairs = [
      { index1: 'SOFR', index2: 'Prime', avgSpread: 325, exposure: 2_800_000_000 },
      { index1: 'SOFR', index2: 'Fed Funds', avgSpread: 8, exposure: 1_500_000_000 },
      { index1: '1M SOFR', index2: '3M SOFR', avgSpread: 12, exposure: 800_000_000 },
      { index1: 'SOFR', index2: '1Y Treasury', avgSpread: -15, exposure: 1_200_000_000 },
    ];

    return basisPairs.map(bp => {
      const historicalSpread: { date: Date; spread: number }[] = [];
      let spread = bp.avgSpread;

      for (let i = 36; i >= 0; i--) {
        spread = bp.avgSpread + this.randomNormal(0, Math.abs(bp.avgSpread) * 0.1);
        historicalSpread.push({
          date: subMonths(this.asOfDate, i),
          spread,
        });
      }

      return {
        indexPair: { index1: bp.index1, index2: bp.index2 },
        historicalSpread,
        currentSpread: spread,
        volatility: Math.abs(bp.avgSpread) * this.randomFloat(0.08, 0.15),
        correlation: this.randomFloat(0.85, 0.98),
        stressSpread: bp.avgSpread * this.randomFloat(1.5, 2.5),
        exposureAmount: bp.exposure,
      };
    });
  }

  // ----------------------------------------------------------------------------
  // Full Assumption Library Generation
  // ----------------------------------------------------------------------------

  generateAssumptionLibrary(): AssumptionLibrary {
    const depositBetas = this.generateEnhancedDepositBetas();
    const loanAssumptions = this.generateLoanAssumptions();
    const basisRisks = this.generateBasisRiskAssumptions();

    // Aggregate historical values
    const assumptionHistory: AssumptionHistoryPoint[] = [];

    // Add deposit beta history
    for (const db of depositBetas) {
      for (let i = 0; i < Math.min(12, db.historicalBeta.length); i++) {
        const hb = db.historicalBeta[i];
        assumptionHistory.push({
          asOfDate: hb.date,
          category: 'deposit_beta',
          parameterKey: `${db.productName.toLowerCase().replace(/\s+/g, '_')}_beta`,
          parameterLabel: `${db.productName} Beta`,
          value: hb.value,
          priorValue: i > 0 ? db.historicalBeta[i - 1]?.value : undefined,
        });
      }
    }

    // Add loan assumption history
    for (const la of loanAssumptions) {
      assumptionHistory.push(...la.historicalValues);
    }

    // Calculate summary metrics
    const avgDepositBeta = depositBetas.reduce((sum, db) => sum + db.levelBeta * db.balance, 0) /
      depositBetas.reduce((sum, db) => sum + db.balance, 0);
    const avgLoanPrepayment = loanAssumptions.reduce((sum, la) => sum + la.prepayment.baselineCPR * la.balance, 0) /
      loanAssumptions.reduce((sum, la) => sum + la.balance, 0);
    const avgLoanBeta = loanAssumptions
      .filter(la => la.pricingBeta.levelBeta > 0)
      .reduce((sum, la) => sum + la.pricingBeta.levelBeta * la.balance, 0) /
      Math.max(1, loanAssumptions.filter(la => la.pricingBeta.levelBeta > 0).reduce((sum, la) => sum + la.balance, 0));

    return {
      asOfDate: this.asOfDate,
      depositBetas,
      loanAssumptions,
      basisRisks,
      optionAssumptions: [], // Can be expanded later
      assumptionHistory,
      summaryMetrics: {
        avgDepositBeta,
        avgLoanPrepayment,
        avgLoanBeta,
        totalBetaAdjustedGap: this.randomFloat(-500_000_000, 500_000_000),
      },
    };
  }

  // ----------------------------------------------------------------------------
  // Full Data Generation
  // ----------------------------------------------------------------------------

  generateAllData() {
    const currentRun = this.generateRun(true);
    const priorRun = this.generateRun(false);
    const scenarioSet = this.generateScenarioSet();
    const curves = this.generateYieldCurves(scenarioSet);
    const positions = this.generatePositions();

    // Generate metrics for each scenario
    const metricsMap: Record<string, RiskMetrics> = {};
    for (const scenario of scenarioSet.scenarios) {
      metricsMap[scenario.scenarioId] = this.generateRiskMetrics(currentRun.runId, scenario.scenarioId);
    }

    const depositProducts = this.generateDepositProducts();
    const macroSeries = this.generateMacroSeries();
    const currentAssumptions = this.generateAssumptionSet(2, 'approved');
    const draftAssumptions = this.generateAssumptionSet(3, 'draft');
    const alerts = this.generateAlerts(metricsMap['up_200'] || metricsMap['base']);
    const liquidity = this.generateLiquidityMetrics(currentRun.runId);
    const hedges = this.generateHedges();
    const backtests = this.generateBacktestResults();
    const assumptionLibrary = this.generateAssumptionLibrary();

    return {
      currentRun,
      priorRun,
      scenarioSet,
      curves,
      positions,
      metrics: metricsMap,
      depositProducts,
      macroSeries,
      assumptionSets: [currentAssumptions, draftAssumptions],
      alerts,
      liquidity,
      hedges,
      backtests,
      assumptionLibrary,
    };
  }
}

// Singleton instance for demo mode
let generatorInstance: ALMDataGenerator | null = null;
let cachedData: ReturnType<ALMDataGenerator['generateAllData']> | null = null;

export function getALMDemoData(seed?: string, institutionId?: string) {
  if (!generatorInstance || seed || institutionId) {
    generatorInstance = new ALMDataGenerator(seed, institutionId);
    cachedData = null;
  }

  if (!cachedData) {
    cachedData = generatorInstance.generateAllData();
  }

  return cachedData;
}

export function resetALMDemoData() {
  generatorInstance = null;
  cachedData = null;
}
