'use client';

import React, { useState } from 'react';
import { Info, ExternalLink, ChevronDown, ChevronUp, Shield, FileCheck, AlertTriangle, Droplet } from 'lucide-react';
import { REGULATORY_STANDARDS } from '@/lib/alm/data/generator';

interface StandardsCardProps {
  variant?: 'compact' | 'full';
  showOnly?: ('scenarios' | 'reporting' | 'assumptions' | 'liquidity')[];
  className?: string;
}

const STANDARD_ICONS = {
  bcbs239: FileCheck,
  irrbb: AlertTriangle,
  sr117: Shield,
  baselLiquidity: Droplet,
};

const STANDARD_COLORS = {
  bcbs239: 'text-blue-600 bg-blue-50 border-blue-200',
  irrbb: 'text-amber-600 bg-amber-50 border-amber-200',
  sr117: 'text-purple-600 bg-purple-50 border-purple-200',
  baselLiquidity: 'text-cyan-600 bg-cyan-50 border-cyan-200',
};

export function StandardsCard({ variant = 'compact', showOnly, className = '' }: StandardsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const standards = Object.entries(REGULATORY_STANDARDS).filter(([_, standard]) => {
    if (!showOnly) return true;
    return standard.applicableTo.some((area) => showOnly.includes(area as typeof showOnly[number]));
  });

  if (variant === 'compact') {
    return (
      <div className={`bg-slate-50 border border-slate-200 rounded-lg ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" />
            <span className="font-medium">Standards & Definitions</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 space-y-2">
            {standards.map(([key, standard]) => {
              const Icon = STANDARD_ICONS[key as keyof typeof STANDARD_ICONS];
              const colors = STANDARD_COLORS[key as keyof typeof STANDARD_COLORS];
              return (
                <div
                  key={standard.id}
                  className={`flex items-start gap-2 p-2 rounded border ${colors}`}
                >
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">{standard.shortName}</span>
                      {standard.url && (
                        <a
                          href={standard.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-60 hover:opacity-100"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs opacity-75 mt-0.5 leading-tight">
                      {standard.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Regulatory Standards & Definitions</h3>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          This dashboard aligns with the following industry standards and regulatory frameworks.
        </p>
      </div>

      <div className="p-4 grid gap-3 sm:grid-cols-2">
        {standards.map(([key, standard]) => {
          const Icon = STANDARD_ICONS[key as keyof typeof STANDARD_ICONS];
          const colors = STANDARD_COLORS[key as keyof typeof STANDARD_COLORS];
          return (
            <div
              key={standard.id}
              className={`p-3 rounded-lg border ${colors}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{standard.shortName}</span>
                    {standard.url && (
                      <a
                        href={standard.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        title="View standard documentation"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-medium opacity-80">{standard.name}</p>
                  <p className="text-xs opacity-70 mt-1.5 leading-relaxed">
                    {standard.description}
                  </p>
                  <div className="flex gap-1 mt-2">
                    {standard.applicableTo.map((area) => (
                      <span
                        key={area}
                        className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-white/50"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 rounded-b-lg">
        <p className="text-xs text-slate-500">
          <strong>Note:</strong> This is a demonstration/reporting layer. Model calculations are performed by upstream ALM systems.
          Data shown is synthetic and for illustrative purposes only.
        </p>
      </div>
    </div>
  );
}

// Simplified inline badge for use in headers
export function StandardsBadge({ standard }: { standard: keyof typeof REGULATORY_STANDARDS }) {
  const config = REGULATORY_STANDARDS[standard];
  if (!config) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
      <Shield className="w-3 h-3" />
      {config.shortName}
    </span>
  );
}

export default StandardsCard;
