import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering and disable Vercel Data Cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// API route for AI-powered ALCO report generation
// Uses OpenAI GPT API for narrative generation

interface ReportRequest {
  runId: string;
  metrics: {
    nii12m: number;
    eveImpact: number;
    doe: number;
    nim: number;
    dv01: number;
    survivalHorizon: number;
    alertCount: number;
  };
  scenarios: {
    name: string;
    niiImpact: number;
    eveImpact: number;
  }[];
  deposits: {
    name: string;
    beta: number;
    stability: string;
  }[];
  alerts: {
    severity: string;
    title: string;
    description: string;
  }[];
  macroData?: {
    fedFundsRate?: number;
    treasury10Y?: number;
    treasury2Y?: number;
    unemploymentRate?: number;
    cpi?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json();

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      // Return mock response if no API key
      return NextResponse.json({
        success: true,
        report: generateMockReport(body),
        mode: 'demo',
      }, {
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      });
    }

    // Build macro context if available
    const macroContext = body.macroData ? `
CURRENT MACROECONOMIC ENVIRONMENT (from FRED):
- Fed Funds Rate: ${body.macroData.fedFundsRate?.toFixed(2) || 'N/A'}%
- 10-Year Treasury: ${body.macroData.treasury10Y?.toFixed(2) || 'N/A'}%
- 2-Year Treasury: ${body.macroData.treasury2Y?.toFixed(2) || 'N/A'}%
- Unemployment Rate: ${body.macroData.unemploymentRate?.toFixed(1) || 'N/A'}%
- CPI (YoY): ${body.macroData.cpi?.toFixed(1) || 'N/A'}%
` : '';

    // Call OpenAI API
    const systemPrompt = `You are an expert ALM (Asset-Liability Management) analyst generating executive reports for ALCO (Asset-Liability Committee) meetings.

Generate reports in PLAIN TEXT ONLY - no markdown, no bullet points with asterisks, no headers with hash marks. Use clear paragraph breaks and numbered lists where appropriate.

The report should be:
- Quantitative: Include specific numbers, basis points, dollar amounts, and percentages
- Actionable: Provide clear recommendations with timeframes
- Concise: Executive summary style, focusing on material items
- Professional: Suitable for board-level presentation
- Context-aware: Reference macroeconomic conditions when making recommendations`;

    const userPrompt = `Generate an ALCO executive report based on the following data:

CURRENT METRICS:
- NII at 12 months: $${(body.metrics.nii12m / 1_000_000).toFixed(0)}M
- EVE sensitivity (+200bp): ${body.metrics.eveImpact.toFixed(1)}%
- Duration of Equity: ${body.metrics.doe.toFixed(1)} years
- Net Interest Margin: ${body.metrics.nim.toFixed(2)}%
- DV01: $${(body.metrics.dv01 / 1000).toFixed(0)}K
- Liquidity Survival Horizon: ${body.metrics.survivalHorizon} days
- Active Alerts: ${body.metrics.alertCount}
${macroContext}
SCENARIO RESULTS:
${body.scenarios.map(s => `- ${s.name}: NII ${s.niiImpact > 0 ? '+' : ''}${s.niiImpact.toFixed(1)}%, EVE ${s.eveImpact > 0 ? '+' : ''}${s.eveImpact.toFixed(1)}%`).join('\n')}

DEPOSIT BEHAVIOR:
${body.deposits.map(d => `- ${d.name}: Beta ${d.beta.toFixed(2)}, Stability: ${d.stability}`).join('\n')}

ACTIVE ALERTS:
${body.alerts.length > 0 ? body.alerts.map(a => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.description}`).join('\n') : 'No critical alerts'}

Generate a comprehensive ALCO report with these sections:
1. Executive Summary (5-7 key points)
2. Limit and Breach Commentary
3. Drivers of Change vs Prior Period
4. Scenario Highlights (NII and EVE sensitivity)
5. Deposit Behavior and Assumptions
6. Liquidity and Funding Position
7. Recommended Actions (Immediate, Near-term, Strategic)
8. Appendix Notes

Remember: PLAIN TEXT ONLY, no markdown formatting.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json({
        success: true,
        report: generateMockReport(body),
        mode: 'demo',
        error: 'AI API unavailable, using demo mode',
      }, {
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      });
    }

    const data = await response.json();
    const reportContent = data.choices?.[0]?.message?.content || generateMockReport(body);

    return NextResponse.json({
      success: true,
      report: reportContent,
      mode: 'ai',
    }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      }
    );
  }
}

function generateMockReport(body: ReportRequest): string {
  return `ALCO EXECUTIVE SUMMARY
Report Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Data Quality Score: 95%

KEY FINDINGS:
1. Net Interest Income at 12 months is projected at $${(body.metrics.nii12m / 1_000_000).toFixed(0)}M under base case
2. EVE sensitivity under +200bp shock is ${body.metrics.eveImpact.toFixed(1)}%, within policy limits
3. Duration of Equity at ${body.metrics.doe.toFixed(1)} years indicates moderate interest rate risk
4. Liquidity survival horizon of ${body.metrics.survivalHorizon} days exceeds minimum requirement
5. ${body.metrics.alertCount} active alerts requiring attention

---

LIMIT AND BREACH COMMENTARY

Current limit utilization remains within policy bounds. EVE sensitivity is being monitored closely as rate volatility continues. No critical breaches reported this period.

Key Observations:
- EVE +200bp: ${Math.abs(body.metrics.eveImpact).toFixed(1)}% against 15% limit (OK)
- NII at Risk: Within tolerance bands
- DV01: $${(body.metrics.dv01 / 1000).toFixed(0)}K against $2,000K limit (OK)

---

DRIVERS OF CHANGE VS PRIOR RUN

1. Balance sheet growth of approximately 2% driven by loan originations
2. Deposit beta assumptions refined based on recent market data
3. Securities portfolio duration extended due to rate movements
4. New hedging activity reducing interest rate exposure

---

SCENARIO HIGHLIGHTS

NII Sensitivity Analysis:
${body.scenarios.map(s => `- ${s.name}: ${s.niiImpact > 0 ? '+' : ''}${s.niiImpact.toFixed(1)}% impact`).join('\n')}

The institution shows asset sensitivity, benefiting from rising rate scenarios but exposed to declining rates. Non-parallel scenarios show moderate sensitivity to curve shape changes.

---

DEPOSIT BEHAVIOR AND ASSUMPTIONS

Beta Summary:
${body.deposits.map(d => `- ${d.name}: Beta = ${d.beta.toFixed(2)} (${d.stability})`).join('\n')}

Deposit betas continue to trend in line with expectations. MMDA products show higher pass-through rates as competitive pressures persist. Core transaction accounts remain stable with low beta behavior.

---

LIQUIDITY AND FUNDING

Current Position:
- Survival Horizon: ${body.metrics.survivalHorizon} days (exceeds 90-day minimum)
- Core deposit funding remains strong
- Contingency funding sources tested and available

---

RECOMMENDED ACTIONS

Immediate (Within 30 Days):
- Review deposit pricing strategy in light of competitive environment
- Monitor EVE limit utilization as it approaches warning threshold

Near-Term (30-90 Days):
- Evaluate hedging opportunities given current rate outlook
- Complete annual assumption validation

Strategic (90+ Days):
- Consider balance sheet restructuring options
- Assess long-term funding strategy

---

APPENDIX NOTES

This report was generated for demonstration purposes. Production reports should use validated ALM system outputs and be reviewed by appropriate personnel before distribution.

Report Generated: ${new Date().toLocaleString()}
Classification: Internal Use Only`;
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ALM Report Generator',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasFredKey: !!process.env.FRED_API_KEY,
  }, {
    headers: { 'Cache-Control': 'no-store, must-revalidate' },
  });
}
