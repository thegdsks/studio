import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { ThemeStyle } from '@/components/system/ThemeProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Studio — nine specialists, one launch',
  description:
    'One sentence in. Nine specialist agents in parallel. A complete startup launch kit out — brand, logo, landing page, copy, legal, prospects, competitors, posts, strategy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} ${mono.variable}`}
    >
      <head>
        <ThemeStyle />
      </head>
      <body className="min-h-screen bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
