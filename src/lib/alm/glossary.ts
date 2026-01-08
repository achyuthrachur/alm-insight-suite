// ALM Glossary - Comprehensive definitions for all financial terms and acronyms
// Used throughout the application to provide consistent, beginner-friendly explanations

export const ALM_GLOSSARY = {
  // Core Acronyms
  ALM: {
    term: 'Asset-Liability Management',
    short: 'ALM',
    definition: 'The practice of managing a bank\'s balance sheet to optimize profitability while managing interest rate risk, liquidity risk, and other financial risks.',
    simpleExplanation: 'How a bank manages the money it lends (assets) versus the money it owes (liabilities) to stay profitable and safe.',
  },
  ALCO: {
    term: 'Asset-Liability Committee',
    short: 'ALCO',
    definition: 'A senior management committee responsible for overseeing the bank\'s balance sheet strategy, interest rate risk, liquidity, and funding decisions.',
    simpleExplanation: 'The group of executives who meet regularly to review the bank\'s financial risks and make strategic decisions.',
  },
  NII: {
    term: 'Net Interest Income',
    short: 'NII',
    definition: 'The difference between interest earned on assets (loans, securities) and interest paid on liabilities (deposits, borrowings) over a period.',
    simpleExplanation: 'The bank\'s profit from lending money at higher rates than it pays depositors. This is typically the largest source of bank revenue.',
    example: 'If a bank earns 5% on loans and pays 2% on deposits, the 3% difference is net interest income.',
  },
  EVE: {
    term: 'Economic Value of Equity',
    short: 'EVE',
    definition: 'A measure of the present value of all future cash flows from assets minus liabilities. Shows the long-term value impact of interest rate changes.',
    simpleExplanation: 'What the bank would be worth today if we consider all future income and payments, adjusted for time value of money.',
    example: 'A -8.5% EVE change under +200bp means the bank\'s economic value would drop 8.5% if rates rise 2%.',
  },
  DOE: {
    term: 'Duration of Equity',
    short: 'DOE',
    definition: 'Measures how sensitive the bank\'s equity value is to interest rate changes. Higher duration means more sensitivity.',
    simpleExplanation: 'How much the bank\'s value changes when interest rates move. A DOE of 5 years means a 1% rate change affects equity by about 5%.',
    example: 'DOE of 6.5 years means if rates rise 1%, equity value drops approximately 6.5%.',
  },
  NIM: {
    term: 'Net Interest Margin',
    short: 'NIM',
    definition: 'Net Interest Income divided by average earning assets, expressed as a percentage. A key profitability metric.',
    simpleExplanation: 'The percentage profit margin the bank makes on its loans and investments. Higher is generally better.',
    example: 'A NIM of 3.25% means the bank earns 3.25 cents of profit for every dollar of assets.',
  },
  DV01: {
    term: 'Dollar Value of 01 (one basis point)',
    short: 'DV01',
    definition: 'The change in portfolio value for a 1 basis point (0.01%) change in interest rates. Used to measure interest rate risk.',
    simpleExplanation: 'How much money the bank gains or loses when interest rates move by 0.01%. Helps measure risk exposure.',
    example: 'A DV01 of $1.25M means the bank gains/loses $1.25 million for every 0.01% rate change.',
  },

  // Rate Scenarios
  basisPoint: {
    term: 'Basis Point (bp)',
    short: 'bp',
    definition: 'One hundredth of a percentage point (0.01%). Used to express changes in interest rates.',
    simpleExplanation: '1 bp = 0.01%. So 100bp = 1%, and 200bp = 2%.',
    example: '+200bp means interest rates increase by 2 percentage points.',
  },
  parallelShock: {
    term: 'Parallel Shock',
    short: 'Parallel',
    definition: 'A scenario where all interest rates across all maturities move by the same amount simultaneously.',
    simpleExplanation: 'What happens if ALL rates (short and long term) move up or down by the same amount.',
  },
  steepener: {
    term: 'Yield Curve Steepener',
    short: 'Steepener',
    definition: 'A scenario where long-term rates rise more than short-term rates, increasing the slope of the yield curve.',
    simpleExplanation: 'When long-term rates go up faster than short-term rates, making borrowing short and lending long more profitable.',
  },
  flattener: {
    term: 'Yield Curve Flattener',
    short: 'Flattener',
    definition: 'A scenario where the difference between short and long-term rates decreases.',
    simpleExplanation: 'When short and long-term rates become closer together, often squeezing bank profit margins.',
  },

  // Deposit Behavior
  depositBeta: {
    term: 'Deposit Beta',
    short: 'Beta',
    definition: 'The percentage of market rate changes that get passed through to deposit rates. A beta of 0.50 means 50% pass-through.',
    simpleExplanation: 'How much the bank adjusts deposit rates when market rates change. Lower beta = bank keeps more profit when rates rise.',
    example: 'A beta of 0.65 means if Fed raises rates by 1%, the bank raises deposit rates by only 0.65%.',
  },
  passThrough: {
    term: 'Pass-Through Rate',
    short: 'Pass-through',
    definition: 'Similar to beta - the percentage of market rate changes passed to customers.',
    simpleExplanation: 'How much of a rate change the bank passes on to depositors.',
  },
  halfLife: {
    term: 'Deposit Half-Life',
    short: 'Half-life',
    definition: 'The time it takes for half of a deposit balance to leave the bank under normal conditions.',
    simpleExplanation: 'How long deposits typically stay at the bank. Longer is better for stability.',
    example: 'A 3-year half-life means half the deposits will still be there after 3 years.',
  },
  decayRate: {
    term: 'Decay Rate',
    short: 'Decay',
    definition: 'The rate at which deposits leave the bank over time, used in modeling deposit behavior.',
    simpleExplanation: 'How quickly depositors withdraw their money. Lower decay = more stable funding.',
  },

  // Loan Metrics
  CPR: {
    term: 'Constant Prepayment Rate',
    short: 'CPR',
    definition: 'The annualized percentage of loans expected to be prepaid early. Higher CPR means faster loan payoff.',
    simpleExplanation: 'How fast borrowers are paying off their loans early (like refinancing mortgages when rates drop).',
    example: 'A CPR of 10% means about 10% of the loan balance is expected to prepay this year.',
  },
  PD: {
    term: 'Probability of Default',
    short: 'PD',
    definition: 'The likelihood that a borrower will fail to make required loan payments.',
    simpleExplanation: 'The chance a borrower won\'t pay back their loan.',
  },
  LGD: {
    term: 'Loss Given Default',
    short: 'LGD',
    definition: 'The percentage of loan value lost when a borrower defaults, after recoveries.',
    simpleExplanation: 'How much money the bank loses when a borrower doesn\'t pay, after selling any collateral.',
    example: 'An LGD of 40% means the bank recovers 60% but loses 40% of the loan amount.',
  },

  // Securities
  MBS: {
    term: 'Mortgage-Backed Securities',
    short: 'MBS',
    definition: 'Securities backed by pools of mortgage loans. Subject to prepayment and extension risk.',
    simpleExplanation: 'Investments made up of bundled home mortgages. Their value and cashflows depend on homeowner behavior.',
  },
  HTM: {
    term: 'Held-to-Maturity',
    short: 'HTM',
    definition: 'Securities the bank intends to hold until they mature. Carried at amortized cost, not market value.',
    simpleExplanation: 'Bonds the bank plans to keep until they pay off. Not marked to market value on the balance sheet.',
  },
  AFS: {
    term: 'Available-for-Sale',
    short: 'AFS',
    definition: 'Securities that may be sold before maturity. Market value changes affect equity through other comprehensive income.',
    simpleExplanation: 'Bonds the bank might sell. Changes in their market value affect the bank\'s reported equity.',
  },

  // Liquidity
  survivalHorizon: {
    term: 'Liquidity Survival Horizon',
    short: 'Survival Days',
    definition: 'The number of days the bank can survive a stress scenario without external funding.',
    simpleExplanation: 'How many days the bank can operate under stress before running out of cash.',
    example: '95 days survival means the bank can meet all obligations for 95 days under severe stress.',
  },
  LCR: {
    term: 'Liquidity Coverage Ratio',
    short: 'LCR',
    definition: 'High-quality liquid assets divided by expected 30-day net cash outflows. Must be ≥100%.',
    simpleExplanation: 'Does the bank have enough easy-to-sell assets to cover 30 days of cash needs?',
  },
  NSFR: {
    term: 'Net Stable Funding Ratio',
    short: 'NSFR',
    definition: 'Stable funding divided by required stable funding. Measures long-term funding stability.',
    simpleExplanation: 'Does the bank have enough long-term funding to support its long-term assets?',
  },

  // Hedging
  swap: {
    term: 'Interest Rate Swap',
    short: 'Swap',
    definition: 'A contract to exchange fixed and floating interest rate payments, used to manage interest rate risk.',
    simpleExplanation: 'An agreement to trade fixed-rate payments for floating-rate payments (or vice versa) to manage risk.',
    example: 'A pay-fixed swap: Bank pays 4% fixed, receives floating SOFR. Protects against rising rates.',
  },
  notional: {
    term: 'Notional Amount',
    short: 'Notional',
    definition: 'The reference amount used to calculate payments in a derivative contract. Not actually exchanged.',
    simpleExplanation: 'The base amount used to calculate swap payments. It\'s just for math - no one actually exchanges this money.',
  },
  MTM: {
    term: 'Mark-to-Market',
    short: 'MTM',
    definition: 'The current market value of a position. Positive MTM means the position is profitable.',
    simpleExplanation: 'What the position is worth right now if we closed it today.',
  },
  hedgeEffectiveness: {
    term: 'Hedge Effectiveness',
    short: 'Effectiveness',
    definition: 'How well a hedge offsets changes in the hedged item. Measured by dollar offset ratio and regression R².',
    simpleExplanation: 'How well the hedge is doing its job of reducing risk. Higher percentage = better protection.',
  },

  // Macro/Economic
  FRED: {
    term: 'Federal Reserve Economic Data',
    short: 'FRED',
    definition: 'A database of economic data maintained by the Federal Reserve Bank of St. Louis.',
    simpleExplanation: 'The Federal Reserve\'s free database of economic indicators like interest rates, inflation, and employment.',
  },
  SOFR: {
    term: 'Secured Overnight Financing Rate',
    short: 'SOFR',
    definition: 'A benchmark interest rate based on overnight Treasury repurchase agreements. Replaced LIBOR.',
    simpleExplanation: 'The main benchmark rate for floating-rate loans in the US. Based on actual Treasury transactions.',
  },
  fedFunds: {
    term: 'Federal Funds Rate',
    short: 'Fed Funds',
    definition: 'The interest rate banks charge each other for overnight loans. Set by the Federal Reserve.',
    simpleExplanation: 'The Fed\'s main tool for controlling the economy. When they raise this rate, all other rates tend to follow.',
  },
  yieldCurve: {
    term: 'Yield Curve',
    short: 'Curve',
    definition: 'A graph showing interest rates across different maturities. Usually slopes upward (longer = higher).',
    simpleExplanation: 'A chart showing what interest rates are for different time periods (1 month, 1 year, 10 years, etc.).',
  },

  // Risk Limits
  limitUtilization: {
    term: 'Limit Utilization',
    short: 'Utilization',
    definition: 'The current risk level as a percentage of the approved risk limit.',
    simpleExplanation: 'How close the bank is to its risk limit. 80% means 80% of the allowed risk is being used.',
  },
  breach: {
    term: 'Limit Breach',
    short: 'Breach',
    definition: 'When a risk metric exceeds its approved limit, requiring management action and board notification.',
    simpleExplanation: 'The bank has exceeded an approved risk level and must take corrective action.',
  },

  // Repricing
  repricingGap: {
    term: 'Repricing Gap',
    short: 'Gap',
    definition: 'The difference between assets and liabilities that reprice in a given time period.',
    simpleExplanation: 'The mismatch between when loans/investments reset rates versus when deposits reset rates.',
    example: 'A positive gap in 0-3 months means more assets than liabilities reprice soon - good for rising rates.',
  },
  assetSensitive: {
    term: 'Asset Sensitive',
    short: 'Asset-Sensitive',
    definition: 'A bank that benefits when interest rates rise because assets reprice faster than liabilities.',
    simpleExplanation: 'The bank makes more money when rates go up. More loans/investments reset quickly than deposits.',
  },
  liabilitySensitive: {
    term: 'Liability Sensitive',
    short: 'Liability-Sensitive',
    definition: 'A bank that benefits when interest rates fall because liabilities reprice faster than assets.',
    simpleExplanation: 'The bank makes more money when rates go down. Deposits reset quickly but loans are locked in.',
  },

  // Data Quality
  dataQuality: {
    term: 'Data Quality Score',
    short: 'DQ Score',
    definition: 'A measure of completeness, accuracy, and timeliness of the data used in ALM calculations.',
    simpleExplanation: 'How good and reliable the data is. Higher scores mean more trustworthy results.',
  },

  // Common Account Types
  MMDA: {
    term: 'Money Market Deposit Account',
    short: 'MMDA',
    definition: 'A savings account that typically offers higher interest rates with limited check-writing privileges.',
    simpleExplanation: 'A higher-rate savings account. Usually has limits on withdrawals but pays better interest.',
  },
  CD: {
    term: 'Certificate of Deposit',
    short: 'CD',
    definition: 'A time deposit with a fixed term and usually a fixed interest rate. Early withdrawal incurs penalties.',
    simpleExplanation: 'A savings account where you lock up money for a set time (like 1 year) in exchange for higher rates.',
  },
  DDA: {
    term: 'Demand Deposit Account',
    short: 'DDA',
    definition: 'A checking account where funds can be withdrawn at any time without notice.',
    simpleExplanation: 'A regular checking account. Money can be withdrawn anytime.',
  },
} as const;

// Helper function to get a tooltip for a term
export function getTooltip(key: keyof typeof ALM_GLOSSARY, detailed = false): string {
  const entry = ALM_GLOSSARY[key];
  if (detailed) {
    const example = 'example' in entry ? entry.example : undefined;
    return `${entry.term} (${entry.short}): ${entry.simpleExplanation}${example ? ` Example: ${example}` : ''}`;
  }
  return `${entry.term}: ${entry.simpleExplanation}`;
}

// Get full term from short code
export function getFullTerm(key: keyof typeof ALM_GLOSSARY): string {
  return ALM_GLOSSARY[key].term;
}

// Module descriptions for page headers
export const MODULE_DESCRIPTIONS = {
  overview: {
    title: 'ALCO Flight Deck',
    subtitle: 'Asset-Liability Management Overview',
    description: 'Your central command center for monitoring the bank\'s financial health. This dashboard shows key risk metrics, active alerts, and recent changes at a glance. Use this to quickly assess the bank\'s interest rate risk position, liquidity status, and any items requiring attention.',
  },
  scenarios: {
    title: 'Interest Rate Risk Analysis',
    subtitle: 'Scenario Comparison & Sensitivity',
    description: 'Explore how different interest rate environments affect the bank\'s profitability (NII) and value (EVE). Compare multiple scenarios including rate shocks, curve twists, and economic projections. This helps identify which rate environments pose the greatest risk or opportunity.',
  },
  deposits: {
    title: 'Deposit Behavior Lab',
    subtitle: 'Beta Analysis & Decay Modeling',
    description: 'Understand how deposit pricing responds to market rate changes. Deposit "beta" measures how much of a Fed rate increase gets passed to depositors. Lower beta means the bank keeps more profit. This module also models how long deposits stay at the bank (decay/survival curves).',
  },
  assumptions: {
    title: 'Model Assumptions',
    subtitle: 'Parameters Driving ALM Calculations',
    description: 'Review and compare the assumptions used in ALM models. These include deposit betas (pricing behavior), loan prepayment speeds (CPR), credit loss estimates, and basis risk factors. Assumptions directly impact all risk calculations, so accuracy is critical.',
  },
  liquidity: {
    title: 'Liquidity & Funding',
    subtitle: 'Cash Flow Projections & Stress Testing',
    description: 'Monitor the bank\'s ability to meet cash obligations under normal and stressed conditions. The survival horizon shows how many days the bank can operate without external funding. Track funding concentration and contingency sources to ensure adequate liquidity buffers.',
  },
  hedges: {
    title: 'Hedges & Strategy',
    subtitle: 'Derivative Portfolio & Risk Mitigation',
    description: 'Manage interest rate hedges (like swaps) that protect the bank from rate movements. View the current hedge portfolio, measure effectiveness, and simulate new hedging strategies. Hedges help stabilize earnings and equity value when rates change.',
  },
  macro: {
    title: 'Macro Sensitivity',
    subtitle: 'Economic Drivers & Correlations',
    description: 'Analyze how macroeconomic factors (Fed Funds rate, unemployment, inflation) affect bank performance. See which economic indicators most influence deposit behavior and interest rate risk. Helps connect ALM to broader economic trends.',
  },
  backtesting: {
    title: 'Model Validation',
    subtitle: 'Forecast vs Actual Performance',
    description: 'Compare model predictions against actual results to validate accuracy. Track forecast errors over time and identify when models may need recalibration. Good backtesting ensures the bank can trust its risk projections.',
  },
  report: {
    title: 'AI ALCO Pack',
    subtitle: 'Executive Narrative Report',
    description: 'Generate an executive-ready summary report for ALCO meetings. The AI synthesizes current metrics, scenarios, and alerts into clear narrative commentary with actionable recommendations. Perfect for board presentations and regulatory reporting.',
  },
  data: {
    title: 'Data Explorer',
    subtitle: 'Source Data & Quality',
    description: 'Browse the underlying data powering all ALM calculations. View individual positions, rate curves, assumptions, and more. Export data for further analysis. Data quality indicators show completeness and accuracy of each dataset.',
  },
} as const;

// Chart-specific explanations
export const CHART_EXPLANATIONS = {
  riskSurfaceHeatmap: {
    title: 'Risk Surface Heatmap',
    explanation: 'This heatmap shows how different rate scenarios (rows) affect the bank\'s income or value across different time horizons (columns). Green cells indicate positive impact (bank benefits), red cells indicate negative impact (bank loses). Darker colors mean larger impacts.',
    howToRead: 'Find a scenario on the left, then look across to see impacts at different time points. Click any cell for details.',
  },
  yieldCurve: {
    title: 'Yield Curve Viewer',
    explanation: 'Shows interest rates at different maturities (3 months to 30 years). Each line represents a different scenario. The shape of the curve matters: upward slope is normal, flat or inverted curves often signal economic concerns.',
    howToRead: 'Compare how different scenarios shift rates. Steepeners widen the gap between short and long rates; flatteners narrow it.',
  },
  repricingGap: {
    title: 'Repricing Gap Analysis',
    explanation: 'Compares when assets (loans, securities) and liabilities (deposits, borrowings) will reprice to new interest rates. A "gap" means a mismatch - assets and liabilities repricing at different times.',
    howToRead: 'Positive gap (bars above zero) = more assets reprice than liabilities. This is good when rates rise but bad when they fall.',
  },
  eveWaterfall: {
    title: 'EVE Waterfall',
    explanation: 'Breaks down what\'s causing the change in Economic Value of Equity. Each bar shows one component\'s contribution. Helps identify which parts of the balance sheet are driving risk.',
    howToRead: 'Green bars add value, red bars subtract value. The final bar shows the total EVE change.',
  },
  cashflowLadder: {
    title: 'Liquidity Cashflow Ladder',
    explanation: 'Shows expected cash inflows (from loan payments, maturing securities) versus cash outflows (deposit withdrawals, debt payments) over time. Helps ensure the bank can meet all obligations.',
    howToRead: 'Compare green (inflows) vs red (outflows) bars in each time bucket. Net gaps show potential funding needs.',
  },
  depositBetaScatter: {
    title: 'Deposit Beta Regression',
    explanation: 'Plots deposit rate changes against market rate changes to measure pricing sensitivity. The slope of the trend line is the "beta." Points closer to the line mean more consistent pricing behavior.',
    howToRead: 'A steep line = high beta (deposits reprice quickly with market). R² shows how well the line fits the data (higher = more reliable).',
  },
  survivalCurve: {
    title: 'Deposit Survival Curve',
    explanation: 'Shows what percentage of today\'s deposits are expected to remain at the bank over time. Deposits don\'t leave all at once - they decay gradually as customers close accounts or move money.',
    howToRead: 'The curve shows retention over time. Where it crosses 50% is the "half-life" - when half of deposits will have left.',
  },
  correlationMatrix: {
    title: 'Correlation Matrix',
    explanation: 'Shows how strongly different variables move together. Correlation ranges from -1 (move opposite) to +1 (move together). Zero means no relationship.',
    howToRead: 'Darker blue = strong positive correlation. Darker red = strong negative correlation. White = no correlation.',
  },
  forecastVsActual: {
    title: 'Forecast vs Actual',
    explanation: 'Compares what the model predicted against what actually happened. Smaller gaps between lines mean better model accuracy.',
    howToRead: 'The dashed line is forecast, solid line is actual. Large gaps indicate model error that may need investigation.',
  },
} as const;

// Scenario explanations
export const SCENARIO_EXPLANATIONS = {
  base: 'The current forward curve - what the market expects rates to do based on futures prices.',
  up_100: 'All rates rise by 1% (100 basis points) immediately. Tests sensitivity to moderate rate increase.',
  up_200: 'All rates rise by 2% (200 basis points) immediately. Standard regulatory stress scenario for rising rates.',
  up_300: 'All rates rise by 3% (300 basis points) immediately. Severe rising rate stress test.',
  down_100: 'All rates fall by 1% (100 basis points) immediately. Tests sensitivity to moderate rate decrease.',
  down_200: 'All rates fall by 2% (200 basis points) immediately. Standard stress scenario for falling rates.',
  steepener: 'Short rates stay low while long rates rise. Benefits banks that borrow short and lend long.',
  flattener: 'Short rates rise while long rates stay flat. Squeezes traditional bank profit margins.',
  ramp_up: 'Rates gradually rise over 12-24 months rather than immediately. More realistic than instant shocks.',
  ramp_down: 'Rates gradually fall over 12-24 months. Tests exposure to prolonged low-rate environment.',
} as const;

export type GlossaryKey = keyof typeof ALM_GLOSSARY;
export type ModuleKey = keyof typeof MODULE_DESCRIPTIONS;
export type ChartKey = keyof typeof CHART_EXPLANATIONS;
export type ScenarioKey = keyof typeof SCENARIO_EXPLANATIONS;

// Type for individual glossary entries
export interface GlossaryEntry {
  term: string;
  short: string;
  definition: string;
  simpleExplanation: string;
  example?: string;
}
