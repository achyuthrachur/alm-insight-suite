'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/alm/layout/Sidebar';
import { Header } from '@/components/alm/layout/Header';
import { ALMProvider } from '@/components/alm/providers/ALMProvider';
import { GlossaryPanel, GlossaryButton } from '@/components/alm/GlossaryPanel';

export default function ALMLayout({ children }: { children: React.ReactNode }) {
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  return (
    <ALMProvider>
      <div className="min-h-screen bg-alm-bg-light-primary dark:bg-alm-bg-primary">
        <Sidebar />
        <div className="pl-64 transition-all duration-200">
          <Header />
          <main className="p-6">{children}</main>
        </div>

        {/* Glossary Help Panel */}
        <GlossaryButton onClick={() => setIsGlossaryOpen(true)} />
        <GlossaryPanel isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} />
      </div>
    </ALMProvider>
  );
}
