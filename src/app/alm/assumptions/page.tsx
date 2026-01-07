'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  FileCheck,
  Clock,
  User,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  GitCompare,
  Eye,
  Download,
} from 'lucide-react';
import { useALM } from '@/components/alm/providers/ALMProvider';
import { ChartContainer } from '@/components/alm/charts/ChartContainer';
import { cn } from '@/lib/utils/cn';

export default function AssumptionsPage() {
  const { isLoading, assumptionSets } = useALM();
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const selectedSet = useMemo(() => {
    if (!assumptionSets || assumptionSets.length === 0) return null;
    return selectedSetId
      ? assumptionSets.find((s) => s.id === selectedSetId)
      : assumptionSets[0];
  }, [assumptionSets, selectedSetId]);

  const approvedSet = useMemo(() => {
    return assumptionSets?.find((s) => s.status === 'approved');
  }, [assumptionSets]);

  // Group parameters by category
  const groupedParams = useMemo(() => {
    if (!selectedSet) return {};
    const groups: Record<string, typeof selectedSet.parameters> = {};
    for (const param of selectedSet.parameters) {
      if (!groups[param.category]) {
        groups[param.category] = [];
      }
      groups[param.category].push(param);
    }
    return groups;
  }, [selectedSet]);

  const statusConfig = {
    draft: { color: 'badge-neutral', icon: Clock, label: 'Draft' },
    review: { color: 'badge-warning', icon: AlertTriangle, label: 'In Review' },
    approved: { color: 'badge-success', icon: Check, label: 'Approved' },
    archived: { color: 'badge-neutral', icon: X, label: 'Archived' },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton h-96 rounded-xl" />
          <div className="lg:col-span-2 skeleton h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alm-text-dark dark:text-alm-text-primary">
            Assumptions Studio
          </h1>
          <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary mt-1">
            Manage, version, and approve model assumptions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className={cn('btn-secondary', showDiff && 'bg-alm-accent/10 border-alm-accent')}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare
          </button>
          <button className="btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Export Pack
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assumption Sets List */}
        <div className="premium-card">
          <div className="p-4 border-b border-slate-100 dark:border-alm-border">
            <h3 className="font-semibold">Assumption Sets</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-alm-border">
            {assumptionSets?.map((set) => {
              const config = statusConfig[set.status];
              const isSelected = selectedSet?.id === set.id;

              return (
                <motion.button
                  key={set.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setSelectedSetId(set.id)}
                  className={cn(
                    'w-full p-4 text-left transition-colors',
                    isSelected
                      ? 'bg-alm-accent/5 border-l-2 border-alm-accent'
                      : 'hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{set.name}</p>
                      <p className="text-xs text-alm-text-muted">v{set.version}</p>
                    </div>
                    <span className={config.color}>{config.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-alm-text-muted">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {set.owner}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(set.updatedAt), 'MMM d')}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Parameters Detail */}
        <div className="lg:col-span-2 premium-card">
          {selectedSet ? (
            <>
              <div className="p-4 border-b border-slate-100 dark:border-alm-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedSet.name}</h3>
                    <p className="text-sm text-alm-text-muted">
                      {selectedSet.parameters.length} parameters
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSet.status === 'draft' && (
                      <button className="btn-primary text-sm">Submit for Review</button>
                    )}
                    {selectedSet.status === 'review' && (
                      <button className="btn-primary text-sm">Approve</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
                {Object.entries(groupedParams).map(([category, params]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium uppercase text-alm-text-muted mb-3 capitalize">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {params.map((param) => (
                        <div
                          key={param.key}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{param.label}</p>
                              {param.sensitivity === 'high' && (
                                <span className="badge-danger text-xxs">High Impact</span>
                              )}
                            </div>
                            <p className="text-xs text-alm-text-muted mt-0.5">
                              {param.rationale}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold tabular-nums">
                              {typeof param.value === 'number'
                                ? param.value.toFixed(2)
                                : String(param.value)}
                              {param.unit && (
                                <span className="text-sm font-normal text-alm-text-muted ml-1">
                                  {param.unit}
                                </span>
                              )}
                            </p>
                            <p className="text-xxs text-alm-text-muted capitalize">
                              {param.scope}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Audit Trail */}
              {selectedSet.approvals.length > 0 && (
                <div className="p-4 border-t border-slate-100 dark:border-alm-border">
                  <h4 className="text-sm font-medium mb-3">Approval History</h4>
                  <div className="space-y-2">
                    {selectedSet.approvals.map((approval, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center',
                            approval.decision === 'approved'
                              ? 'bg-alm-success/10 text-alm-success'
                              : approval.decision === 'rejected'
                              ? 'bg-alm-danger/10 text-alm-danger'
                              : 'bg-alm-warning/10 text-alm-warning'
                          )}
                        >
                          {approval.decision === 'approved' ? (
                            <Check className="w-3 h-3" />
                          ) : approval.decision === 'rejected' ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{approval.approver}</span>
                          <span className="text-alm-text-muted"> ({approval.role})</span>
                        </div>
                        <span className="text-alm-text-muted">
                          {format(new Date(approval.timestamp), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-alm-text-muted">
              Select an assumption set to view details
            </div>
          )}
        </div>
      </div>

      {/* Impact Preview */}
      <ChartContainer
        title="Assumption Impact Preview"
        subtitle="Estimated metric changes if current draft is approved"
        tooltip="Shows approximate impact on key risk metrics from assumption changes"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'NII Impact', value: '+$2.3M', change: '+0.5%', positive: true },
            { label: 'EVE Impact', value: '-$5.1M', change: '-0.3%', positive: false },
            { label: 'DOE Change', value: '+0.2 yrs', change: '+3.1%', positive: false },
            { label: 'Beta Sensitivity', value: 'Higher', change: '+8%', positive: false },
          ].map((metric) => (
            <div key={metric.label} className="p-4 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary text-center">
              <p className="text-sm text-alm-text-muted mb-1">{metric.label}</p>
              <p className="text-xl font-bold">{metric.value}</p>
              <p
                className={cn(
                  'text-sm font-medium',
                  metric.positive ? 'text-alm-success' : 'text-alm-danger'
                )}
              >
                {metric.change}
              </p>
            </div>
          ))}
        </div>
      </ChartContainer>
    </div>
  );
}
