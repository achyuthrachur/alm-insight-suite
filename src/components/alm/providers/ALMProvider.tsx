'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useALMData } from '@/hooks/useALMData';

type ALMContextType = ReturnType<typeof useALMData>;

const ALMContext = createContext<ALMContextType | null>(null);

interface ALMProviderProps {
  children: ReactNode;
}

export function ALMProvider({ children }: ALMProviderProps) {
  const almData = useALMData();

  return <ALMContext.Provider value={almData}>{children}</ALMContext.Provider>;
}

export function useALM() {
  const context = useContext(ALMContext);
  if (!context) {
    throw new Error('useALM must be used within an ALMProvider');
  }
  return context;
}
