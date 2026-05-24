/**
 * Fallback landing page synthesizer.
 *
 * When the Developer agent fails or returns malformed output, this module
 * produces a complete, production-quality static HTML page using the brand
 * name, copywriter hero text, and designer palette that are already available
 * in upstream context. No external calls -- pure string assembly.
 */

import { sanitizeSlug } from './cloudflare.js';
import type { DeveloperOutput } from '../../../../agents/developer/schema.js';

export interface FallbackInput {
  brandName: string;
  /** Hero headline from copywriter output, if available. */
  heroHeadline?: string;
  /** Hero subheading / tagline from copywriter output, if available. */
  heroSubheadline?: string;
  /** Primary CTA label from copywriter output. */
  ctaLabel?: string;
  /** Designer palette primary hex, e.g. "#3B82F6". */
  primary?: string;
  /** Designer palette secondary / accent hex. */
  accent?: string;
  /** Designer palette background hex. */
  surface?: string;
}

function hex(val: string | undefined, fallback: string): string {
  if (!val || !/^#[0-9a-fA-F]{3,8}$/.test(val)) return fallback;
  return val;
}

export function synthesizeFallbackLanding(input: FallbackInput): Pick<DeveloperOutput, 'html' | 'projectPath'> {
  const brand = input.brandName || 'Studio';
  const headline = input.heroHeadline || `${brand}: Built for what comes next`;
  const sub = input.heroSubheadline || `The fastest way to go from idea to live product.`;
  const cta = input.ctaLabel || 'Get early access';
  const primary = hex(input.primary, '#6366f1');
  const accent = hex(input.accent, '#22d3ee');
  const surface = hex(input.surface, '#0a0a0f');
  const projectPath = sanitizeSlug(brand).slice(0, 40);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${brand}</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: { primary: '${primary}', accent: '${accent}' }
        }
      }
    }
  };
</script>
<style>
  :root {
    --color-primary: ${primary};
    --color-accent: ${accent};
    --color-surface: ${surface};
  }
  html { scroll-behavior: smooth; }
  body { background-color: var(--color-surface); }
  .gradient-text {
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .cta-btn {
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  }
  .card-border {
    border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  }
</style>
</head>
<body class="min-h-screen font-sans antialiased" style="background-color:${surface}">

  <!-- Nav -->
  <nav class="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md" style="background-color:color-mix(in srgb,${surface} 80%,transparent)">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <span class="text-white font-bold text-lg tracking-tight">${brand}</span>
      <a href="#waitlist" class="cta-btn text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">${cta}</a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="pt-40 pb-28 px-6 text-center max-w-4xl mx-auto">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/60 mb-8 font-mono">
      <span class="h-1.5 w-1.5 rounded-full" style="background:${accent}"></span>
      Now in private beta
    </div>
    <h1 class="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-none tracking-tighter mb-6">
      <span class="gradient-text">${brand}</span>
    </h1>
    <p class="text-xl sm:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-4">${headline}</p>
    <p class="text-base text-white/50 max-w-xl mx-auto mb-10">${sub}</p>
    <a href="#waitlist" class="cta-btn inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity shadow-xl">
      ${cta}
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </a>
  </section>

  <!-- Features -->
  <section class="py-20 px-6 max-w-6xl mx-auto">
    <h2 class="text-center text-3xl sm:text-4xl font-bold text-white mb-4">Everything you need to ship</h2>
    <p class="text-center text-white/50 mb-14 max-w-xl mx-auto">Built for speed. Designed to last.</p>
    <div class="grid sm:grid-cols-3 gap-6">
      ${['Launch faster than ever', 'Built for real scale', 'Trusted by founders'].map((f, i) => `
      <div class="card-border rounded-2xl p-7" style="background-color:color-mix(in srgb,white 4%,${surface})">
        <div class="w-10 h-10 rounded-xl mb-5 flex items-center justify-center" style="background:color-mix(in srgb,${primary} 20%,transparent)">
          <span class="font-mono text-sm font-bold" style="color:${primary}">0${i + 1}</span>
        </div>
        <h3 class="text-white font-semibold text-lg mb-2">${f}</h3>
        <p class="text-white/50 text-sm leading-relaxed">Purpose-built tooling that removes friction from your workflow and keeps your team moving forward.</p>
      </div>`).join('')}
    </div>
  </section>

  <!-- Social proof -->
  <section class="py-16 px-6 border-t border-white/5">
    <div class="max-w-3xl mx-auto text-center">
      <p class="text-white/40 text-sm font-mono uppercase tracking-widest mb-6">Trusted by teams at</p>
      <div class="flex flex-wrap justify-center gap-8 text-white/20 text-lg font-bold">
        ${['Acme Corp', 'Horizon', 'Meridian', 'Pulse'].map(n => `<span>${n}</span>`).join('')}
      </div>
    </div>
  </section>

  <!-- Waitlist -->
  <section id="waitlist" class="py-28 px-6">
    <div class="max-w-lg mx-auto text-center">
      <h2 class="text-4xl font-bold text-white mb-4">Join the waitlist</h2>
      <p class="text-white/50 mb-10">Be first to access ${brand} when we open the doors.</p>
      <form onsubmit="handleSubmit(event)" class="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="you@company.com"
          required
          class="flex-1 rounded-xl px-4 py-3.5 text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
          style="background-color:color-mix(in srgb,white 6%,${surface})"
        />
        <button type="submit" class="cta-btn text-white font-semibold px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
          ${cta}
        </button>
      </form>
      <p class="text-white/30 text-xs mt-4">No spam. Unsubscribe anytime.</p>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-8 px-6 border-t border-white/5 text-center">
    <p class="text-white/30 text-sm">&copy; ${new Date().getFullYear()} ${brand}. All rights reserved.</p>
  </footer>

  <script>
    function handleSubmit(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = 'You are on the list.';
      btn.disabled = true;
    }
  </script>
</body>
</html>`;

  return { html, projectPath };
}
