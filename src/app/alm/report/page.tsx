'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Play, Copy, Download, Check, Loader2, Sparkles, Bot } from 'lucide-react';
import { useALM } from '@/components/alm/providers/ALMProvider';

export default function ReportPage() {
  const { currentRun, metrics, liquidity, unresolvedAlerts, depositProducts, scenarioSet } = useALM();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [reportMode, setReportMode] = useState<'ai' | 'demo' | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate report via API
  const generateReport = async () => {
    setIsGenerating(true);
    setReport(null);
    setError(null);

    try {
      // Fetch FRED macro data first
      let macroData = null;
      try {
        const fredResponse = await fetch('/api/alm/fred');
        const fredData = await fredResponse.json();
        if (fredData.success && fredData.latest) {
          macroData = {
            fedFundsRate: fredData.latest.fedFundsRate,
            treasury10Y: fredData.latest.treasury10Y,
            treasury2Y: fredData.latest.treasury2Y,
            unemploymentRate: fredData.latest.unemploymentRate,
            cpi: fredData.latest.cpi,
          };
        }
      } catch (fredError) {
        console.log('FRED data not available, continuing without macro context');
      }

      // Prepare metrics data for API
      const baseMetrics = metrics?.['base'];
      const upMetrics = metrics?.['up_200'];

      const requestBody = {
        runId: currentRun?.runId || 'demo-run',
        metrics: {
          nii12m: baseMetrics?.nii.projectedNII || 485000000,
          eveImpact: upMetrics?.eve.impactPercent || -8.5,
          doe: baseMetrics?.duration.equityDuration || 6.5,
          nim: baseMetrics?.nii.projectedNII ? (baseMetrics.nii.projectedNII / 15000000000) * 100 : 3.25,
          dv01: baseMetrics?.duration.dv01 || 1250000,
          survivalHorizon: liquidity?.survivalHorizon || 95,
          alertCount: unresolvedAlerts?.length || 0,
        },
        scenarios: scenarioSet?.scenarios.slice(0, 6).map(s => ({
          name: s.name,
          niiImpact: metrics?.[s.scenarioId]?.nii.impactPercent || 0,
          eveImpact: metrics?.[s.scenarioId]?.eve.impactPercent || 0,
        })) || [],
        deposits: depositProducts?.slice(0, 5).map(d => ({
          name: d.productName,
          beta: d.beta.levelBeta,
          stability: d.beta.stability,
        })) || [],
        alerts: unresolvedAlerts?.slice(0, 5).map(a => ({
          severity: a.severity,
          title: a.title,
          description: a.description,
        })) || [],
        macroData,
      };

      const response = await fetch('/api/alm/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setReport(data.report);
        setReportMode(data.mode);
        if (data.error) {
          setError(data.error);
        }
      } else {
        setError(data.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Report generation error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
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
              {reportMode === 'ai' ? (
                <>
                  <span className="badge-success flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI GENERATED
                  </span>
                  <span className="text-sm text-alm-text-muted">
                    Report generated by Claude AI
                  </span>
                </>
              ) : (
                <>
                  <span className="badge-warning flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    DEMO MODE
                  </span>
                  <span className="text-sm text-alm-text-muted">
                    Report generated with synthetic template
                  </span>
                </>
              )}
              {error && (
                <span className="text-xs text-alm-warning ml-2">({error})</span>
              )}
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
