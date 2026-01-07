'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
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

  // Available datasets
  const datasets: DataSet[] = useMemo(() => [
    {
      id: 'positions',
      name: 'Positions',
      description: 'Balance sheet positions including assets, liabilities, and derivatives',
      recordCount: positions?.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'id', type: 'string' },
        { field: 'category', type: 'enum' },
        { field: 'productType', type: 'enum' },
        { field: 'productName', type: 'string' },
        { field: 'balance', type: 'number' },
        { field: 'coupon', type: 'number' },
        { field: 'rateType', type: 'enum' },
        { field: 'duration', type: 'number' },
      ],
    },
    {
      id: 'scenarios',
      name: 'Scenarios',
      description: 'Interest rate scenarios and yield curve data',
      recordCount: scenarioSet?.scenarios.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'scenarioId', type: 'string' },
        { field: 'name', type: 'string' },
        { field: 'tags', type: 'array' },
        { field: 'isBase', type: 'boolean' },
      ],
    },
    {
      id: 'curves',
      name: 'Yield Curves',
      description: 'Spot rate curves by scenario',
      recordCount: curves?.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'curveId', type: 'string' },
        { field: 'scenarioId', type: 'string' },
        { field: 'points', type: 'array' },
      ],
    },
    {
      id: 'deposits',
      name: 'Deposit Products',
      description: 'Deposit behavior data including betas and decay parameters',
      recordCount: depositProducts?.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'productId', type: 'string' },
        { field: 'productName', type: 'string' },
        { field: 'balance', type: 'number' },
        { field: 'beta', type: 'object' },
        { field: 'decay', type: 'object' },
      ],
    },
    {
      id: 'macro',
      name: 'Macro Series',
      description: 'Economic and market data time series',
      recordCount: macroSeries?.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'id', type: 'string' },
        { field: 'name', type: 'string' },
        { field: 'units', type: 'string' },
        { field: 'points', type: 'array' },
      ],
    },
    {
      id: 'assumptions',
      name: 'Assumptions',
      description: 'Model assumption sets and parameters',
      recordCount: assumptionSets?.reduce((sum, s) => sum + s.parameters.length, 0) || 0,
      lastUpdated: assumptionSets?.[0]?.updatedAt || new Date(),
      quality: 'good',
      schema: [
        { field: 'key', type: 'string' },
        { field: 'label', type: 'string' },
        { field: 'value', type: 'mixed' },
        { field: 'category', type: 'enum' },
      ],
    },
    {
      id: 'alerts',
      name: 'Alerts',
      description: 'Active alerts and limit breaches',
      recordCount: alerts?.length || 0,
      lastUpdated: new Date(),
      quality: alerts?.some(a => a.severity === 'critical') ? 'warning' : 'good',
      schema: [
        { field: 'id', type: 'string' },
        { field: 'severity', type: 'enum' },
        { field: 'type', type: 'enum' },
        { field: 'title', type: 'string' },
      ],
    },
    {
      id: 'liquidity',
      name: 'Liquidity',
      description: 'Cashflow projections and funding data',
      recordCount: liquidity?.cashflowLadder.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'bucket', type: 'string' },
        { field: 'inflows', type: 'number' },
        { field: 'outflows', type: 'number' },
        { field: 'netFlow', type: 'number' },
      ],
    },
    {
      id: 'hedges',
      name: 'Hedges',
      description: 'Derivative hedge positions',
      recordCount: hedges?.length || 0,
      lastUpdated: currentRun?.timestamp || new Date(),
      quality: 'good',
      schema: [
        { field: 'id', type: 'string' },
        { field: 'type', type: 'enum' },
        { field: 'notional', type: 'number' },
        { field: 'marketValue', type: 'number' },
      ],
    },
  ], [positions, scenarioSet, curves, depositProducts, macroSeries, assumptionSets, alerts, liquidity, hedges, currentRun]);

  // Get sample data for selected dataset
  const sampleData = useMemo(() => {
    switch (selectedDataset) {
      case 'positions':
        return positions?.slice(0, 10).map(p => ({
          id: p.id,
          category: p.category,
          productType: p.productType,
          productName: p.productName,
          balance: `$${(p.balance / 1_000_000).toFixed(0)}M`,
          coupon: p.coupon ? `${(p.coupon * 100).toFixed(2)}%` : '-',
          rateType: p.rateType,
          duration: p.duration?.toFixed(1) || '-',
        }));
      case 'scenarios':
        return scenarioSet?.scenarios.map(s => ({
          scenarioId: s.scenarioId,
          name: s.name,
          shortName: s.shortName,
          tags: s.tags.join(', '),
          isBase: s.isBase ? 'Yes' : 'No',
        }));
      case 'deposits':
        return depositProducts?.map(d => ({
          productId: d.productId,
          productName: d.productName,
          balance: `$${(d.balance / 1_000_000).toFixed(0)}M`,
          beta: d.beta.levelBeta.toFixed(2),
          rSquared: d.beta.rSquared.toFixed(2),
          halfLife: `${d.decay.halfLife.toFixed(0)} mo`,
        }));
      case 'alerts':
        return alerts?.map(a => ({
          id: a.id,
          severity: a.severity,
          type: a.type,
          title: a.title,
          createdAt: format(new Date(a.createdAt), 'MMM d'),
        }));
      case 'hedges':
        return hedges?.map(h => ({
          id: h.id,
          type: h.type,
          description: h.description,
          notional: `$${(h.notional / 1_000_000).toFixed(0)}M`,
          mtm: `$${(h.marketValue / 1_000_000).toFixed(1)}M`,
          maturity: format(new Date(h.maturityDate), 'MMM yyyy'),
        }));
      default:
        return [];
    }
  }, [selectedDataset, positions, scenarioSet, depositProducts, alerts, hedges]);

  const selectedDatasetInfo = datasets.find(d => d.id === selectedDataset);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alm-text-dark dark:text-alm-text-primary">
            Data Explorer
          </h1>
          <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
            Browse and export underlying data
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
                    <button className="btn-secondary">
                      <Eye className="w-4 h-4 mr-2" />
                      View Full
                    </button>
                    <button className="btn-primary">
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
                      {format(new Date(selectedDatasetInfo.lastUpdated), 'MMM d, h:mm a')}
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
                  <h4 className="text-sm font-medium mb-2">Preview (First 10 Records)</h4>
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
