'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useALMData } from '@/hooks/useALMData';

type ALMContextType = ReturnType<typeof useALMData>;

const ALMContext = createContext<ALMContextType | null>(null);

interface ALMProviderProps {
  children: ReactNode;
}

export function ALMProvider({ children }: ALMProviderProps) {
  const [mounted, setMounted] = useState(false);
  const almData = useALMData();

  // Prevent hydration mismatch by only rendering after client mount
  // This ensures data generation happens exclusively on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during SSR and initial hydration
  // This prevents the server from generating data that could become stale
  if (!mounted) {
    return (
      <ALMContext.Provider value={almData}>
        <div className="min-h-screen bg-alm-bg-light-primary dark:bg-alm-bg-primary flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-alm-accent-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-alm-text-secondary text-sm">Loading ALM Suite...</p>
          </div>
        </div>
      </ALMContext.Provider>
    );
  }

  return <ALMContext.Provider value={almData}>{children}</ALMContext.Provider>;
}

export function useALM() {
  const context = useContext(ALMContext);
  if (!context) {
    throw new Error('useALM must be used within an ALMProvider');
  }
  return context;
}
