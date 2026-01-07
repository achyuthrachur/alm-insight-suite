'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  trend?: 'up' | 'down' | 'flat';
  status?: 'good' | 'warning' | 'bad' | 'neutral';
  tooltip?: string;
  onClick?: () => void;
  sparkline?: number[];
  className?: string;
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  unit,
  delta,
  deltaLabel,
  trend,
  status = 'neutral',
  tooltip,
  onClick,
  sparkline,
  className,
  loading = false,
}: KPICardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const statusColors = {
    good: 'text-alm-success',
    warning: 'text-alm-warning',
    bad: 'text-alm-danger',
    neutral: 'text-alm-text-secondary',
  };

  const deltaStatusColor =
    trend === 'up'
      ? status === 'bad'
        ? 'text-alm-danger'
        : 'text-alm-success'
      : trend === 'down'
      ? status === 'bad'
        ? 'text-alm-danger'
        : status === 'good'
        ? 'text-alm-success'
        : 'text-alm-danger'
      : 'text-alm-text-muted';

  if (loading) {
    return (
      <div className={cn('kpi-card', className)}>
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(
        'kpi-card',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="kpi-label flex items-center gap-1.5">
          {title}
          {tooltip && (
            <span className="group relative">
              <Info className="w-3.5 h-3.5 text-alm-text-muted cursor-help" />
              <span className="tooltip group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48">
                {tooltip}
              </span>
            </span>
          )}
        </p>
        {status !== 'neutral' && (
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              status === 'good' && 'bg-alm-success',
              status === 'warning' && 'bg-alm-warning',
              status === 'bad' && 'bg-alm-danger'
            )}
          />
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className={cn('kpi-value', statusColors[status])}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-sm text-alm-text-dark-secondary dark:text-alm-text-muted font-medium">
            {unit}
          </span>
        )}
      </div>

      {(delta !== undefined || sparkline) && (
        <div className="flex items-center justify-between">
          {delta !== undefined && (
            <div className={cn('flex items-center gap-1 kpi-delta', deltaStatusColor)}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)}%
              </span>
              {deltaLabel && (
                <span className="text-alm-text-muted font-normal">{deltaLabel}</span>
              )}
            </div>
          )}

          {sparkline && sparkline.length > 0 && (
            <Sparkline data={sparkline} className="w-16 h-6" trend={trend} />
          )}
        </div>
      )}
    </motion.div>
  );
}

// Mini sparkline component
function Sparkline({
  data,
  className,
  trend,
}: {
  data: number[];
  className?: string;
  trend?: 'up' | 'down' | 'flat';
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor =
    trend === 'up'
      ? 'stroke-alm-success'
      : trend === 'down'
      ? 'stroke-alm-danger'
      : 'stroke-alm-accent';

  return (
    <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        className={cn('stroke-2', strokeColor)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
