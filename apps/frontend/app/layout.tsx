import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Studio · 9 agents, one launch kit',
  description:
    'Type one sentence describing your startup idea. Nine specialist AI agents produce a complete launch kit — brand, logo, landing page, copy, legal, prospects, competitors, launch posts, and strategy — in minutes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
