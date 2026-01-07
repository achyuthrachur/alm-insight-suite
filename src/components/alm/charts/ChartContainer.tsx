'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Maximize2, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  tooltip?: string;
  children: ReactNode;
  onViewData?: () => void;
  onExport?: () => void;
  onExpand?: () => void;
  className?: string;
  headerActions?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
}

export function ChartContainer({
  title,
  subtitle,
  tooltip,
  children,
  onViewData,
  onExport,
  onExpand,
  className,
  headerActions,
  loading = false,
  empty = false,
  emptyMessage = 'No data available',
}: ChartContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('chart-container', className)}
    >
      <div className="chart-header">
        <div>
          <h3 className="chart-title flex items-center gap-2">
            {title}
            {tooltip && (
              <span className="group relative">
                <Info className="w-4 h-4 text-alm-text-muted cursor-help" />
                <span className="tooltip group-hover:visible absolute left-0 top-full mt-2 w-64 z-50">
                  {tooltip}
                </span>
              </span>
            )}
          </h3>
          {subtitle && <p className="chart-subtitle mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1">
          {headerActions}
          {onViewData && (
            <button
              onClick={onViewData}
              className="btn-ghost p-2"
              title="View data"
            >
              <Database className="w-4 h-4" />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="btn-ghost p-2"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {onExpand && (
            <button
              onClick={onExpand}
              className="btn-ghost p-2"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative min-h-[200px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-alm-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-alm-text-muted">Loading chart...</p>
            </div>
          </div>
        ) : empty ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-alm-text-muted">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}
