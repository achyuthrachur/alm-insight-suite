'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Landmark,
  Globe,
  FileCheck,
  Droplets,
  Shield,
  FlaskConical,
  FileText,
  Database,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useALM } from '../providers/ALMProvider';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeType?: 'alert' | 'warning' | 'info';
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { criticalAlerts, warningAlerts } = useALM();

  const alertCount = criticalAlerts.length + warningAlerts.length;

  const navSections: NavSection[] = [
    {
      items: [
        {
          label: 'Overview',
          href: '/alm',
          icon: LayoutDashboard,
          badge: alertCount > 0 ? alertCount : undefined,
          badgeType: criticalAlerts.length > 0 ? 'alert' : 'warning',
        },
      ],
    },
    {
      title: 'Risk Analysis',
      items: [
        { label: 'Interest Rate Risk', href: '/alm/scenarios', icon: TrendingUp },
        { label: 'Deposits', href: '/alm/deposits', icon: Landmark },
        { label: 'Macro Sensitivity', href: '/alm/macro', icon: Globe },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Assumptions', href: '/alm/assumptions', icon: FileCheck },
        { label: 'Liquidity', href: '/alm/liquidity', icon: Droplets },
        { label: 'Hedges', href: '/alm/hedges', icon: Shield },
      ],
    },
    {
      title: 'Analysis',
      items: [
        { label: 'Backtesting', href: '/alm/backtesting', icon: FlaskConical },
        { label: 'AI Report', href: '/alm/report', icon: FileText },
        { label: 'Data Explorer', href: '/alm/data', icon: Database },
      ],
    },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 bottom-0 z-30',
        'bg-white dark:bg-alm-bg-secondary',
        'border-r border-slate-200 dark:border-alm-border',
        'flex flex-col'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-alm-border">
        <Link href="/alm" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-alm-accent to-purple-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <h1 className="font-semibold text-alm-text-dark dark:text-alm-text-primary whitespace-nowrap">
                  ALM Insight
                </h1>
                <p className="text-xs text-alm-text-dark-secondary dark:text-alm-text-muted whitespace-nowrap">
                  Suite
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {section.title && !collapsed && (
              <h3 className="px-3 mb-2 text-xs font-medium text-alm-text-dark-secondary dark:text-alm-text-muted uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            {section.title && collapsed && (
              <div className="h-px bg-slate-200 dark:bg-alm-border mx-2 mb-2" />
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'nav-item relative group',
                        isActive && 'active',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5 flex-shrink-0 transition-colors',
                          isActive
                            ? 'text-alm-accent'
                            : 'text-alm-text-dark-secondary dark:text-alm-text-muted group-hover:text-alm-text-dark dark:group-hover:text-alm-text-primary'
                        )}
                      />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="flex-1 whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {item.badge && (
                        <span
                          className={cn(
                            'absolute flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xxs font-medium',
                            collapsed ? 'top-0 right-0' : 'right-3',
                            item.badgeType === 'alert'
                              ? 'bg-alm-danger text-white'
                              : item.badgeType === 'warning'
                              ? 'bg-alm-warning text-white'
                              : 'bg-alm-info text-white'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-slate-200 dark:border-alm-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
            'text-sm text-alm-text-dark-secondary dark:text-alm-text-secondary',
            'hover:bg-slate-100 dark:hover:bg-alm-bg-tertiary',
            'transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
