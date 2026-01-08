'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Search, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { ALM_GLOSSARY, GlossaryKey, GlossaryEntry } from '@/lib/alm/glossary';
import { cn } from '@/lib/utils/cn';

interface GlossaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Group glossary terms by category
const GLOSSARY_CATEGORIES = {
  'Core Metrics': ['NII', 'EVE', 'DOE', 'NIM', 'DV01'] as GlossaryKey[],
  'Organizations & Committees': ['ALM', 'ALCO'] as GlossaryKey[],
  'Rate Scenarios': ['basisPoint', 'parallelShock', 'steepener', 'flattener'] as GlossaryKey[],
  'Deposit Behavior': ['depositBeta', 'passThrough', 'halfLife', 'decayRate'] as GlossaryKey[],
  'Loan Metrics': ['CPR', 'PD', 'LGD'] as GlossaryKey[],
  'Securities': ['MBS', 'HTM', 'AFS'] as GlossaryKey[],
  'Liquidity': ['survivalHorizon', 'LCR', 'NSFR'] as GlossaryKey[],
  'Hedging': ['swap', 'notional', 'MTM', 'hedgeEffectiveness'] as GlossaryKey[],
  'Economic Data': ['FRED', 'SOFR', 'fedFunds', 'yieldCurve'] as GlossaryKey[],
  'Risk Management': ['limitUtilization', 'breach', 'repricingGap', 'assetSensitive', 'liabilitySensitive', 'dataQuality'] as GlossaryKey[],
  'Account Types': ['MMDA', 'CD', 'DDA'] as GlossaryKey[],
};

export function GlossaryPanel({ isOpen, onClose }: GlossaryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Core Metrics']);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Filter terms based on search
  const filterTerms = (terms: GlossaryKey[]) => {
    if (!searchQuery) return terms;
    return terms.filter(key => {
      const entry = ALM_GLOSSARY[key];
      const searchLower = searchQuery.toLowerCase();
      return (
        entry.term.toLowerCase().includes(searchLower) ||
        entry.short.toLowerCase().includes(searchLower) ||
        entry.simpleExplanation.toLowerCase().includes(searchLower)
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-alm-bg-secondary shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-alm-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-alm-accent" />
                <h2 className="font-semibold text-lg">ALM Glossary</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-alm-bg-tertiary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-200 dark:border-alm-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alm-text-muted" />
                <input
                  type="text"
                  placeholder="Search terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              <p className="text-xs text-alm-text-muted mt-2">
                Find definitions for financial terms, acronyms, and ALM concepts
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(GLOSSARY_CATEGORIES).map(([category, terms]) => {
                const filteredTerms = filterTerms(terms);
                if (searchQuery && filteredTerms.length === 0) return null;

                const isExpanded = expandedCategories.includes(category) || !!searchQuery;

                return (
                  <div key={category} className="mb-4">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex items-center gap-2 w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-alm-bg-tertiary rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-alm-text-muted" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-alm-text-muted" />
                      )}
                      <span className="font-medium text-sm">{category}</span>
                      <span className="text-xs text-alm-text-muted ml-auto">
                        {filteredTerms.length} terms
                      </span>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-6 mt-2 space-y-3">
                            {filteredTerms.map(key => {
                              const entry = ALM_GLOSSARY[key] as GlossaryEntry;
                              return (
                                <div
                                  key={key}
                                  className="p-3 rounded-lg bg-slate-50 dark:bg-alm-bg-tertiary"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-alm-accent">
                                      {entry.short}
                                    </span>
                                    <span className="text-sm text-alm-text-muted">
                                      {entry.term}
                                    </span>
                                  </div>
                                  <p className="text-sm text-alm-text-dark dark:text-alm-text-primary leading-relaxed">
                                    {entry.simpleExplanation}
                                  </p>
                                  {entry.example && (
                                    <p className="text-xs text-alm-text-muted mt-2 italic">
                                      Example: {entry.example}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-alm-border bg-slate-50 dark:bg-alm-bg-tertiary">
              <p className="text-xs text-alm-text-muted text-center">
                Hover over metrics with <HelpCircle className="w-3 h-3 inline" /> icons for quick tooltips
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Floating help button to open glossary
export function GlossaryButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 bg-alm-accent text-white rounded-full shadow-lg hover:bg-alm-accent-hover transition-colors"
    >
      <HelpCircle className="w-5 h-5" />
      <span className="font-medium">Glossary</span>
    </motion.button>
  );
}
