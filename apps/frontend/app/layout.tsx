import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeStyle } from '@/components/system/ThemeProvider';
import AppShell from '@/components/AppShell';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Studio. Nine specialists, one launch',
  description:
    'One sentence in. Nine specialist agents in parallel. A complete startup launch kit out: brand, copy, deployed site, prospects, legal. Five minutes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('studio.theme');var sys=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var t=s||sys;document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();` }} />
        <ThemeStyle />
      </head>
      <body className="min-h-screen bg-bg text-text antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
