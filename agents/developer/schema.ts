/**
 * DeveloperOutput: Produced by the Developer agent.
 * The frontend renders the live URL link, code viewer, tech stack badges,
 * next-features roadmap, and analytics snippet on the Developer tab.
 *
 * The agent itself returns { html, projectPath }. The runner wrapper adds
 * liveUrl / deploy_url / deployment_id after Cloudflare Pages deploy.
 */
export interface DeveloperOutput {
  /** Full HTML of the landing page. Rendered in a code viewer with syntax highlighting. */
  html: string;
  /**
   * URL-safe slug derived from the brand name (lowercase, hyphens, max 40 chars).
   * The runner uses this as the Cloudflare Pages project slug.
   */
  projectPath: string;

  /** Live deployment URL. Added by runner after deploy -- not set by the agent. */
  liveUrl?: string;
  /** Alias for liveUrl -- kept for frontend compatibility. */
  deployedUrl?: string;
  /** Raw deploy URL field emitted via runner meta event. */
  deploy_url?: string;
  /** CF Pages deployment ID. Added by runner. */
  deployment_id?: string;

  /** ISO 8601 timestamp of when the deployment completed. Set by runner. */
  deployedAt?: string;

  /** Technologies used to build the page. Rendered as badge chips. */
  tech_stack?: string[];
  /**
   * 3 features to build next, ordered by recommended priority.
   * Rendered as a roadmap list with effort tags.
   */
  next_features?: Array<{
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
  analytics_snippet?: string;
}
