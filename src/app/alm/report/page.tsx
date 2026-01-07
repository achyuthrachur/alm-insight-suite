'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FileText, Play, Copy, Download, Check, Loader2 } from 'lucide-react';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { cn } from '@/lib/utils/cn';

export default function ReportPage() {
  const { currentRun, metrics, liquidity, unresolvedAlerts, depositProducts, hedges } = useALM();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate report content
  const generateReport = () => {
    setIsGenerating(true);
    setReport(null);

    // Simulate streaming generation
    const baseMetrics = metrics?.['base'];
    const upMetrics = metrics?.['up_200'];
    const downMetrics = metrics?.['down_200'];

    const reportSections = [
      `ALCO EXECUTIVE SUMMARY
Report Date: ${format(new Date(), 'MMMM d, yyyy')}
Run: ${currentRun?.label || 'Current Month-End'}
Data Quality Score: ${currentRun?.dataQualityScore || 95}%

KEY FINDINGS:
- Net Interest Income at 12 months is projected at $${((baseMetrics?.nii.projectedNII || 485000000) / 1_000_000).toFixed(0)}M under base case
- EVE sensitivity under +200bp shock is ${upMetrics?.eve.impactPercent.toFixed(1) || -8.5}%, within policy limits
- Duration of Equity at ${baseMetrics?.duration.equityDuration.toFixed(1) || 6.5} years, moderate interest rate risk profile
- Liquidity survival horizon of ${liquidity?.survivalHorizon || 95} days exceeds minimum requirement
- ${unresolvedAlerts.length || 2} active alerts requiring attention`,

      `LIMIT AND BREACH COMMENTARY

Current Limit Status:
- EVE +200bp: ${Math.abs(upMetrics?.eve.impactPercent || 8.5).toFixed(1)}% utilization against 15% limit (${Math.abs(upMetrics?.eve.impactPercent || 8.5) > 12 ? 'WARNING' : 'OK'})
- NII@Risk 12M: ${Math.abs(upMetrics?.nii.impactPercent || 5.2).toFixed(1)}% utilization against 12% limit (OK)
- Duration of Equity: ${baseMetrics?.duration.equityDuration.toFixed(1) || 6.5} years against 10 year limit (OK)
- DV01: $${((baseMetrics?.duration.dv01 || 1250000) / 1000).toFixed(0)}K against $2,000K limit (OK)

Breaches:
${unresolvedAlerts.filter(a => a.type === 'limit_breach').length > 0
  ? unresolvedAlerts.filter(a => a.type === 'limit_breach').map(a => `- ${a.title}: ${a.description}`).join('\n')
  : '- No active breaches at this time'}`,

      `DRIVERS OF CHANGE VS PRIOR RUN

Key Changes (Month-over-Month):
1. Deposit Beta Assumptions: MMDA retail beta increased from 0.60 to 0.65 (+8%), increasing NII sensitivity by approximately $2.1M under rising rate scenarios
2. Loan Portfolio Growth: C&I loans increased by $125M (+5%), adding $0.8M to projected NII
3. Securities Duration: Agency MBS duration extended from 4.5 to 4.8 years due to rate movements
4. New Hedge: Added $200M pay-fixed swap, reducing EVE sensitivity by approximately 45 bps

Balance Sheet Changes:
- Total assets increased by $285M (+1.8%)
- Core deposits grew by $165M (+1.4%)
- Wholesale funding reduced by $50M (-3.2%)`,

      `SCENARIO HIGHLIGHTS

NII Sensitivity (12-Month Horizon):
- Base Case: $${((baseMetrics?.nii.projectedNII || 485000000) / 1_000_000).toFixed(0)}M projected NII
- Up 100bp: +$${((metrics?.['up_100']?.nii.impactAmount || 15000000) / 1_000_000).toFixed(1)}M (+${(metrics?.['up_100']?.nii.impactPercent || 3.1).toFixed(1)}%)
- Up 200bp: +$${((upMetrics?.nii.impactAmount || 28000000) / 1_000_000).toFixed(1)}M (+${(upMetrics?.nii.impactPercent || 5.8).toFixed(1)}%)
- Down 100bp: -$${(Math.abs(metrics?.['down_100']?.nii.impactAmount || -18000000) / 1_000_000).toFixed(1)}M (${(metrics?.['down_100']?.nii.impactPercent || -3.7).toFixed(1)}%)
- Down 200bp: -$${(Math.abs(downMetrics?.nii.impactAmount || -42000000) / 1_000_000).toFixed(1)}M (${(downMetrics?.nii.impactPercent || -8.6).toFixed(1)}%)

EVE Sensitivity:
- Base EVE: $${((baseMetrics?.eve.baseEVE || 1850000000) / 1_000_000).toFixed(0)}M
- Up 200bp Impact: -$${(Math.abs(upMetrics?.eve.impactAmount || -157000000) / 1_000_000).toFixed(0)}M (${upMetrics?.eve.impactPercent.toFixed(1) || -8.5}%)
- Down 200bp Impact: +$${((downMetrics?.eve.impactAmount || 142000000) / 1_000_000).toFixed(0)}M (+${downMetrics?.eve.impactPercent.toFixed(1) || 7.7}%)

Non-Parallel Scenarios:
- Steepener: NII +$${((metrics?.['steepener']?.nii.impactAmount || 8500000) / 1_000_000).toFixed(1)}M, EVE -$${(Math.abs(metrics?.['steepener']?.eve.impactAmount || -25000000) / 1_000_000).toFixed(0)}M
- Flattener: NII -$${(Math.abs(metrics?.['flattener']?.nii.impactAmount || -5200000) / 1_000_000).toFixed(1)}M, EVE +$${((metrics?.['flattener']?.eve.impactAmount || 18000000) / 1_000_000).toFixed(0)}M`,

      `DEPOSIT BEHAVIOR AND ASSUMPTIONS

Beta Summary by Product:
${depositProducts?.map(p => `- ${p.productName}: Beta = ${p.beta.levelBeta.toFixed(2)} (R² = ${p.beta.rSquared.toFixed(2)}, ${p.beta.stability})`).join('\n') || '- Data not available'}

Key Observations:
- MMDA betas continue to trend higher in the current rate environment
- DDA products showing stable, low beta behavior as expected
- CD pricing remains competitive with near-full pass-through

Decay and Maturity:
- Core deposit effective maturities range from 48 to 96 months
- No significant changes to decay assumptions this period
- Backtesting indicates assumptions remain within acceptable tolerance`,

      `LIQUIDITY AND FUNDING

Current Position:
- Survival Horizon: ${liquidity?.survivalHorizon || 95} days (Target: ${liquidity?.survivalHorizonTarget || 90} days)
- Contingency Readiness Score: ${liquidity?.overallScore || 82}%

Funding Composition:
${liquidity?.fundingConcentrations.map(f => `- ${f.sourceName}: $${(f.amount / 1_000_000_000).toFixed(1)}B (${f.percentOfTotal}%)`).join('\n') || '- Data not available'}

Observations:
- Core deposit funding remains strong at ${liquidity?.fundingConcentrations.find(f => f.sourceName === 'Core Deposits')?.percentOfTotal || 62}%
- Wholesale funding concentration within policy limits
- All contingency funding sources tested and available`,

      `HEDGE AND ACTIONS

Current Hedge Portfolio:
${hedges?.map(h => `- ${h.description}: $${(h.notional / 1_000_000).toFixed(0)}M notional, MTM ${h.marketValue >= 0 ? '+' : ''}$${(h.marketValue / 1_000_000).toFixed(1)}M`).join('\n') || '- No active hedges'}

Total Portfolio DV01 Offset: $${((hedges?.reduce((sum, h) => sum + h.dv01, 0) || 655000) / 1000).toFixed(0)}K

RECOMMENDED ACTIONS:

Immediate (Within 30 Days):
- Review and update MMDA beta assumptions based on recent market data
- Monitor EVE limit utilization as it approaches warning threshold

Near-Term (30-90 Days):
- Evaluate additional hedging opportunities given current rate outlook
- Complete annual stress testing documentation
- Update contingency funding plan

Strategic (90+ Days):
- Consider balance sheet restructuring to reduce duration gap
- Assess deposit pricing strategy in context of competitive environment`,

      `APPENDIX: DATA QUALITY AND CAVEATS

Data Sources:
- Position data as of ${format(currentRun?.timestamp || new Date(), 'MMMM d, yyyy')}
- Market data from Treasury and Federal Reserve sources
- Deposit behavior models last calibrated Q3 2024

Caveats:
- This report was generated in DEMO MODE with synthetic data
- Actual production reports should use validated ALM system outputs
- NII projections assume static balance sheet
- EVE calculations use standard regulatory methodology

Model Limitations:
- Deposit beta models may underperform during rapid rate changes
- Prepayment models have limited calibration data for inverted curves
- Liquidity projections assume normal market conditions

Report Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}
Classification: Internal Use Only`
    ];

    // Simulate streaming
    let currentSection = 0;
    let currentText = '';

    const streamReport = () => {
      if (currentSection < reportSections.length) {
        currentText += (currentSection > 0 ? '\n\n---\n\n' : '') + reportSections[currentSection];
        setReport(currentText);
        currentSection++;
        setTimeout(streamReport, 300);
      } else {
        setIsGenerating(false);
      }
    };

    setTimeout(streamReport, 500);
  };

  const copyToClipboard = async () => {
    if (report) {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alm-text-dark dark:text-alm-text-primary">
            AI ALCO Pack
          </h1>
          <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
            Generate executive-ready narrative report
          </p>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <>
              <button onClick={copyToClipboard} className="btn-secondary">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn-secondary">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </>
          )}
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="premium-card"
      >
        {!report && !isGenerating ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-alm-accent/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-alm-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Generate ALCO Pack</h3>
            <p className="text-sm text-alm-text-muted max-w-md mx-auto mb-6">
              Click the Generate button to create an executive-ready narrative report
              summarizing the current ALM position, risk metrics, and recommendations.
            </p>
            <button onClick={generateReport} className="btn-primary">
              <Play className="w-4 h-4 mr-2" />
              Generate Report
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-warning">DEMO MODE</span>
              <span className="text-sm text-alm-text-muted">
                Report generated with synthetic data
              </span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-alm-text-dark dark:text-alm-text-primary bg-transparent p-0 m-0">
                {report}
                {isGenerating && (
                  <span className="inline-block w-2 h-4 bg-alm-accent animate-pulse ml-1" />
                )}
              </pre>
            </div>
          </div>
        )}
      </motion.div>

      {/* Report Structure Info */}
      <div className="premium-card p-6">
        <h3 className="font-semibold mb-4">Report Structure</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'Executive Summary',
            'Limit Commentary',
            'Drivers of Change',
            'Scenario Highlights',
            'Deposit Behavior',
            'Liquidity & Funding',
            'Hedge & Actions',
            'Appendix',
          ].map((section, idx) => (
            <div key={section} className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-alm-accent/10 text-alm-accent flex items-center justify-center text-xs font-medium">
                {idx + 1}
              </span>
              <span>{section}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
