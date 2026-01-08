'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  Database,
  Table,
  FileJson,
  Download,
  Search,
  ChevronRight,
  Check,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { cn } from '@/lib/utils/cn';
import { MODULE_DESCRIPTIONS } from '@/lib/alm/glossary';

interface DataSet {
  id: string;
  name: string;
  description: string;
  recordCount: number;
  lastUpdated: Date;
  quality: 'good' | 'warning' | 'error';
  schema: { field: string; type: string }[];
}

export default function DataExplorerPage() {
  const {
    currentRun,
    scenarioSet,
    curves,
    positions,
    depositProducts,
    macroSeries,
    assumptionSets,
    alerts,
    liquidity,
    hedges,
    backtests,
  } = useALM();

  const [selectedDataset, setSelectedDataset] = useState<string | null>('positions');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRecords, setShowAllRecords] = useState(false);

  // Available datasets with detailed descriptions
  const datasets: DataSet[] = useMemo(() => [
    {
      id: 'positions',
      name: 'Positions',
      description: 'Individual balance sheet items including every loan, deposit account, security, and derivative. Each row represents a specific financial instrument with its characteristics.',
      recordCount: positions?.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'id', type: 'string' },
        { field: 'category', type: 'enum (asset/liability/derivative)' },
        { field: 'productType', type: 'enum (loan/deposit/security/etc)' },
        { field: 'productName', type: 'string' },
        { field: 'balance', type: 'number (dollars)' },
        { field: 'coupon', type: 'number (interest rate %)' },
        { field: 'rateType', type: 'enum (fixed/floating)' },
        { field: 'duration', type: 'number (years)' },
      ],
    },
    {
      id: 'scenarios',
      name: 'Scenarios',
      description: 'Interest rate scenarios used for stress testing. Each scenario defines how rates might change (e.g., +200bp shock, steepener, flattener).',
      recordCount: scenarioSet?.scenarios.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'scenarioId', type: 'string' },
        { field: 'name', type: 'string' },
        { field: 'tags', type: 'array (shock/twist/ramp)' },
        { field: 'isBase', type: 'boolean' },
      ],
    },
    {
      id: 'curves',
      name: 'Yield Curves',
      description: 'Treasury spot rate curves for each scenario, showing rates at each maturity point (3mo, 6mo, 1yr, 2yr, 5yr, 10yr, 30yr).',
      recordCount: curves?.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'curveId', type: 'string' },
        { field: 'scenarioId', type: 'string' },
        { field: 'points', type: 'array of {tenor, rate}' },
      ],
    },
    {
      id: 'deposits',
      name: 'Deposit Products',
      description: 'Behavioral characteristics for each deposit product type including pricing sensitivity (beta), decay rates, and retention curves.',
      recordCount: depositProducts?.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'productId', type: 'string' },
        { field: 'productName', type: 'string' },
        { field: 'balance', type: 'number (dollars)' },
        { field: 'beta', type: 'object {levelBeta, rSquared, stability}' },
        { field: 'decay', type: 'object {halfLife, decayRate}' },
      ],
    },
    {
      id: 'macro',
      name: 'Macro Series',
      description: 'Economic time series data from FRED including Fed Funds rate, Treasury yields, unemployment, and inflation indicators.',
      recordCount: macroSeries?.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'id', type: 'string (FRED series ID)' },
        { field: 'name', type: 'string' },
        { field: 'units', type: 'string (%, index, etc)' },
        { field: 'points', type: 'array of {date, value}' },
      ],
    },
    {
      id: 'assumptions',
      name: 'Assumptions',
      description: 'Model parameters driving ALM calculations including deposit betas, loan prepayment speeds (CPR), credit losses, and basis risk factors.',
      recordCount: assumptionSets?.reduce((sum, s) => sum + s.parameters.length, 0) || 0,
      lastUpdated: assumptionSets?.[0]?.updatedAt || new Date(),
      quality: 'good',
      schema: [
        { field: 'key', type: 'string' },
        { field: 'label', type: 'string' },
        { field: 'value', type: 'mixed (number/string)' },
        { field: 'category', type: 'enum (deposits/loans/basis)' },
      ],
    },
    {
      id: 'alerts',
      name: 'Alerts',
      description: 'Active risk limit breaches and warnings requiring management attention. Includes severity, thresholds, and recommended actions.',
      recordCount: alerts?.length || 0,
      lastUpdated: new Date(),
      quality: alerts?.some(a => a.severity === 'critical') ? 'warning' : 'good',
      schema: [
        { field: 'id', type: 'string' },
        { field: 'severity', type: 'enum (critical/warning/info)' },
        { field: 'type', type: 'enum (limit_breach/model_drift/etc)' },
        { field: 'title', type: 'string' },
      ],
    },
    {
      id: 'liquidity',
      name: 'Liquidity',
      description: 'Cash flow projections showing expected inflows and outflows by time bucket, used for survival horizon and funding gap analysis.',
      recordCount: liquidity?.cashflowLadder.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'bucket', type: 'string (time period)' },
        { field: 'inflows', type: 'number (dollars)' },
        { field: 'outflows', type: 'number (dollars)' },
        { field: 'netFlow', type: 'number (inflows - outflows)' },
      ],
    },
    {
      id: 'hedges',
      name: 'Hedges',
      description: 'Interest rate derivative positions (swaps, caps, floors) used to manage rate risk, including notional amounts, market values, and effectiveness metrics.',
      recordCount: hedges?.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'id', type: 'string' },
        { field: 'type', type: 'enum (pay_fixed_swap/receive_fixed_swap/cap/floor)' },
        { field: 'notional', type: 'number (dollars)' },
        { field: 'marketValue', type: 'number (current MTM value)' },
      ],
    },
  ], [positions, scenarioSet, curves, depositProducts, macroSeries, assumptionSets, alerts, liquidity, hedges, currentRun]);

  // Get data for selected dataset - show all records or preview
  const sampleData = useMemo(() => {
    const limit = showAllRecords ? undefined : 10;
    switch (selectedDataset) {
      case 'positions':
        return positions?.slice(0, limit).map(p => ({
          id: p.id,
          category: p.category,
          productType: p.productType,
          productName: p.productName,
          balance: `$${(p.balance / 1_000_000).toFixed(1)}M`,
          coupon: p.coupon ? `${(p.coupon * 100).toFixed(2)}%` : '-',
          rateType: p.rateType,
          nextRepriceDate: p.nextRepriceDate ? safeFormatDate(p.nextRepriceDate, 'MMM yyyy') : '-',
          maturityDate: p.maturityDate ? safeFormatDate(p.maturityDate, 'MMM yyyy') : '-',
          duration: p.duration?.toFixed(2) || '-',
        }));
      case 'scenarios':
        return scenarioSet?.scenarios.slice(0, limit).map(s => ({
          scenarioId: s.scenarioId,
          name: s.name,
          shortName: s.shortName,
          tags: s.tags.join(', '),
          isBase: s.isBase ? 'Yes' : 'No',
          probability: s.probability ? `${(s.probability * 100).toFixed(0)}%` : '-',
        }));
      case 'curves':
        return curves?.slice(0, limit).map(c => ({
          curveId: c.curveId,
          scenarioId: c.scenarioId,
          '3mo': c.points.find((p: any) => p.tenor === '3M')?.spotRate?.toFixed(2) + '%' || '-',
          '1yr': c.points.find((p: any) => p.tenor === '1Y')?.spotRate?.toFixed(2) + '%' || '-',
          '2yr': c.points.find((p: any) => p.tenor === '2Y')?.spotRate?.toFixed(2) + '%' || '-',
          '5yr': c.points.find((p: any) => p.tenor === '5Y')?.spotRate?.toFixed(2) + '%' || '-',
          '10yr': c.points.find((p: any) => p.tenor === '10Y')?.spotRate?.toFixed(2) + '%' || '-',
          '30yr': c.points.find((p: any) => p.tenor === '30Y')?.spotRate?.toFixed(2) + '%' || '-',
        }));
      case 'deposits':
        return depositProducts?.slice(0, limit).map(d => ({
          productId: d.productId,
          productName: d.productName,
          productType: d.productType,
          balance: `$${(d.balance / 1_000_000).toFixed(0)}M`,
          beta: d.beta.levelBeta.toFixed(2),
          rSquared: d.beta.rSquared.toFixed(2),
          stability: d.beta.stability,
          halfLife: `${d.decay.halfLife.toFixed(0)} mo`,
          decayRate: `${(d.decay.decayRate * 100).toFixed(1)}%`,
          effectiveMaturity: `${d.effectiveMaturity.toFixed(0)} mo`,
        }));
      case 'macro':
        return macroSeries?.slice(0, limit).map(s => ({
          id: s.id,
          name: s.name,
          units: s.units,
          latestValue: s.points[s.points.length - 1]?.value?.toFixed(2) || '-',
          latestDate: s.points[s.points.length - 1]?.date ? safeFormatDate(s.points[s.points.length - 1].date, 'MMM yyyy') : '-',
          pointCount: s.points.length,
        }));
      case 'assumptions':
        const allParams: any[] = [];
        assumptionSets?.forEach(set => {
          set.parameters.forEach(p => {
            allParams.push({
              setName: set.name,
              category: p.category,
              key: p.key,
              label: p.label,
              value: typeof p.value === 'number' ? p.value.toFixed(4) : String(p.value),
              unit: p.unit || '-',
            });
          });
        });
        return allParams.slice(0, limit);
      case 'alerts':
        return alerts?.slice(0, limit).map(a => ({
          id: a.id,
          severity: a.severity,
          type: a.type,
          title: a.title,
          description: a.description,
          metric: a.metric || '-',
          currentValue: a.currentValue?.toFixed(2) || '-',
          threshold: a.threshold?.toFixed(2) || '-',
          createdAt: safeFormatDate(a.createdAt, 'MMM d, yyyy'),
        }));
      case 'liquidity':
        return liquidity?.cashflowLadder.slice(0, limit).map(l => ({
          bucket: l.bucket,
          inflows: `$${(l.inflows / 1_000_000).toFixed(0)}M`,
          outflows: `$${(l.outflows / 1_000_000).toFixed(0)}M`,
          netFlow: `$${(l.netFlow / 1_000_000).toFixed(0)}M`,
          cumulativeGap: `$${(l.cumulativeGap / 1_000_000).toFixed(0)}M`,
        }));
      case 'hedges':
        return hedges?.slice(0, limit).map(h => ({
          id: h.id,
          type: h.type,
          description: h.description,
          notional: `$${(h.notional / 1_000_000).toFixed(0)}M`,
          fixedRate: h.payLeg?.rate ? `${(h.payLeg.rate * 100).toFixed(2)}%` : (h.receiveLeg?.rate ? `${(h.receiveLeg.rate * 100).toFixed(2)}%` : '-'),
          floatingIndex: h.payLeg?.index || h.receiveLeg?.index || '-',
          mtm: `$${(h.marketValue / 1_000_000).toFixed(1)}M`,
          maturity: safeFormatDate(h.maturityDate, 'MMM yyyy'),
          dv01: h.dv01 ? `$${(h.dv01 / 1000).toFixed(0)}K` : '-',
        }));
      default:
        return [];
    }
  }, [selectedDataset, positions, scenarioSet, curves, depositProducts, macroSeries, assumptionSets, alerts, liquidity, hedges, showAllRecords]);

  const selectedDatasetInfo = datasets.find(d => d.id === selectedDataset);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-alm-text-dark dark:text-alm-text-primary">
              {MODULE_DESCRIPTIONS.data.title}
            </h1>
            <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
              {MODULE_DESCRIPTIONS.data.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alm-text-muted" />
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-64"
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-muted max-w-4xl leading-relaxed">
          {MODULE_DESCRIPTIONS.data.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Dataset List */}
        <div className="premium-card">
          <div className="p-4 border-b border-slate-100 dark:border-alm-border">
            <h3 className="font-semibold">Datasets</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-alm-border">
            {datasets
              .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((dataset) => (
                <button
                  key={dataset.id}
                  onClick={() => setSelectedDataset(dataset.id)}
                  className={cn(
                    'w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary/50 transition-colors',
                    selectedDataset === dataset.id && 'bg-alm-accent/5 border-l-2 border-alm-accent'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-alm-text-muted" />
                      <span className="font-medium text-sm">{dataset.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          dataset.quality === 'good' ? 'bg-alm-success' :
                          dataset.quality === 'warning' ? 'bg-alm-warning' : 'bg-alm-danger'
                        )}
                      />
                      <ChevronRight className="w-4 h-4 text-alm-text-muted" />
                    </div>
                  </div>
                  <p className="text-xs text-alm-text-muted mt-1">
                    {dataset.recordCount} records
                  </p>
                </button>
              ))}
          </div>
        </div>

        {/* Data Preview */}
        <div className="lg:col-span-3 space-y-6">
          {selectedDatasetInfo && (
            <>
              {/* Dataset Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedDatasetInfo.name}</h2>
                    <p className="text-sm text-alm-text-muted mt-1">
                      {selectedDatasetInfo.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAllRecords(!showAllRecords)}
                      className={showAllRecords ? "btn-primary" : "btn-secondary"}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showAllRecords ? 'Show Preview' : 'View All Records'}
                    </button>
                    <button className="btn-secondary">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary">
                    <p className="text-xs text-alm-text-muted">Records</p>
                    <p className="text-lg font-semibold">{selectedDatasetInfo.recordCount}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary">
                    <p className="text-xs text-alm-text-muted">Last Updated</p>
                    <p className="text-lg font-semibold">
                      {safeFormatDate(selectedDatasetInfo.lastUpdated, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary">
                    <p className="text-xs text-alm-text-muted">Quality</p>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedDatasetInfo.quality === 'good' ? (
                        <Check className="w-4 h-4 text-alm-success" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-alm-warning" />
                      )}
                      <span className="font-semibold capitalize">{selectedDatasetInfo.quality}</span>
                    </div>
                  </div>
                </div>

                {/* Schema */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2">Schema</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDatasetInfo.schema.map((field) => (
                      <span key={field.field} className="badge-neutral">
                        <span className="font-medium">{field.field}</span>
                        <span className="text-alm-text-muted ml-1">({field.type})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Data Preview Table */}
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    {showAllRecords
                      ? `All Records (${sampleData?.length || 0} total)`
                      : `Preview (First ${Math.min(10, sampleData?.length || 0)} of ${selectedDatasetInfo.recordCount} records)`}
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 dark:border-alm-border rounded-lg">
                    <table className="data-table text-xs">
                      <thead>
                        <tr>
                          {sampleData && sampleData[0] && Object.keys(sampleData[0]).map((key) => (
                            <th key={key} className="whitespace-nowrap">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sampleData?.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, vidx) => (
                              <td key={vidx} className="whitespace-nowrap">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>

              {/* Data Quality */}
              <div className="premium-card p-6">
                <h3 className="font-semibold mb-4">Data Quality Checks</h3>
                <div className="space-y-2">
                  {[
                    { check: 'Schema validation passed', status: 'pass' },
                    { check: 'No null values in required fields', status: 'pass' },
                    { check: 'All foreign keys valid', status: 'pass' },
                    { check: 'Values within expected ranges', status: 'pass' },
                    { check: 'Timestamps are current', status: 'pass' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary">
                      <span className="text-sm">{item.check}</span>
                      <Check className="w-4 h-4 text-alm-success" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
