'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Alert } from '@/lib/alm/types';

interface AlertsFeedProps {
  alerts: Alert[];
  maxItems?: number;
  onAlertClick?: (alert: Alert) => void;
  onViewAll?: () => void;
  className?: string;
}

const alertConfig = {
  critical: {
    icon: AlertTriangle,
    bgColor: 'bg-alm-danger/10',
    borderColor: 'border-alm-danger/30',
    iconColor: 'text-alm-danger',
    label: 'Critical',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-alm-warning/10',
    borderColor: 'border-alm-warning/30',
    iconColor: 'text-alm-warning',
    label: 'Warning',
  },
  info: {
    icon: Info,
    bgColor: 'bg-alm-info/10',
    borderColor: 'border-alm-info/30',
    iconColor: 'text-alm-info',
    label: 'Info',
  },
};

export function AlertsFeed({
  alerts,
  maxItems = 5,
  onAlertClick,
  onViewAll,
  className,
}: AlertsFeedProps) {
  const displayAlerts = alerts.slice(0, maxItems);
  const hasMore = alerts.length > maxItems;

  if (alerts.length === 0) {
    return (
      <div className={cn('premium-card p-6', className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-alm-success/10 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-alm-success" />
          </div>
          <div>
            <h3 className="font-semibold text-alm-text-dark dark:text-alm-text-primary">
              All Clear
            </h3>
            <p className="text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary">
              No active alerts
            </p>
          </div>
        </div>
        <p className="text-sm text-alm-text-muted">
          All metrics are within policy limits and no anomalies detected.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('premium-card', className)}>
      <div className="p-4 border-b border-slate-100 dark:border-alm-border flex items-center justify-between">
        <h3 className="font-semibold text-alm-text-dark dark:text-alm-text-primary">
          Active Alerts
        </h3>
        <span className="badge-danger">{alerts.length}</span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-alm-border">
        <AnimatePresence>
          {displayAlerts.map((alert, idx) => {
            const config = alertConfig[alert.severity];
            const Icon = config.icon;

            return (
              <motion.button
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  'w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary/50',
                  'flex items-start gap-3 transition-colors'
                )}
                onClick={() => onAlertClick?.(alert)}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('w-4 h-4', config.iconColor)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-xs font-medium uppercase',
                        config.iconColor
                      )}
                    >
                      {config.label}
                    </span>
                    <span className="text-xs text-alm-text-muted">
                      {safeFormatDate(alert.createdAt, 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-alm-text-dark dark:text-alm-text-primary truncate">
                    {alert.title}
                  </p>
                  <p className="text-xs text-alm-text-dark-secondary dark:text-alm-text-secondary line-clamp-2 mt-0.5">
                    {alert.description}
                  </p>
                  {alert.linkedModule && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-alm-accent">
                      <span>Go to {alert.linkedModule}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {alert.acknowledgedAt && (
                  <div className="flex-shrink-0">
                    <span className="badge-neutral">
                      <Clock className="w-3 h-3 mr-1" />
                      Ack
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {(hasMore || onViewAll) && (
        <div className="p-3 border-t border-slate-100 dark:border-alm-border">
          <button
            onClick={onViewAll}
            className="w-full text-center text-sm text-alm-accent hover:text-alm-accent-hover font-medium"
          >
            View all {alerts.length} alerts
          </button>
        </div>
      )}
    </div>
  );
}
