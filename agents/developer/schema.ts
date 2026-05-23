/**
 * DeveloperOutput: Produced by the Developer agent.
 * The frontend renders the live URL link, code viewer, tech stack badges,
 * next-features roadmap, and analytics snippet on the Developer tab.
 */
export interface DeveloperOutput {
  /** Live Vercel deployment URL. Rendered as a primary CTA link. */
  liveUrl: string;
  /** Full HTML of the deployed page. Rendered in a code viewer with syntax highlighting. */
  html: string;
  /** ISO 8601 timestamp of when the deployment completed. */
  deployedAt: string;

  /** Technologies used to build the page. Rendered as badge chips. Example: ["HTML5", "Tailwind CSS", "Vercel"]. */
  tech_stack: string[];
  /**
   * 3 features to build next, ordered by recommended priority.
   * Rendered as a roadmap list with effort tags.
   */
  next_features: Array<{
    /** Short feature title. Under 8 words. */
    title: string;
    /** One sentence on why this feature matters and what user problem it solves. */
    rationale: string;
    /** Rough effort estimate: S = a few hours, M = 1-3 days, L = 1-2 weeks. */
    effort: 'S' | 'M' | 'L';
  }>;
  /**
   * A small HTML/JS snippet the founder can paste before </body> to enable
   * privacy-friendly analytics via Plausible or a simple beacon.
   * Rendered in a copy-to-clipboard code block.
   */
  analytics_snippet: string;
}
