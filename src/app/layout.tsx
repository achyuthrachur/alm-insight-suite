import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'ALM Insight Suite',
  description: 'Asset-Liability Management Dashboard for ALCO / Treasury / Risk',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="dark" storageKey="alm-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
