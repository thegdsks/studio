/**
 * CopywriterOutput: Produced by the Copywriter agent.
 * The frontend renders the hero section, feature cards, FAQ accordion,
 * value props, email subjects, meta description, and social bio.
 */
export interface CopywriterOutput {
  /** Hero section copy for the landing page. */
  hero: {
    /** Main headline. Under 10 words. Action-oriented. */
    headline: string;
    /** Supporting sub-headline. 1-2 sentences expanding on the headline. */
    sub: string;
  };
  /** Exactly 3 feature benefit blocks rendered as cards. */
  features: Array<{
    /** Benefit-first title. Under 6 words. */
    title: string;
    /** Short description. 1-2 sentences max. */
    body: string;
  }>;
  /** Exactly 5 FAQ pairs addressing real objections from the target ICP. */
  faq: Array<{
    q: string;
    a: string;
  }>;
  /** Call-to-action button text. Under 5 words. */
  cta: string;

  /** 3 short alternative sub-headline bullet props for A/B testing. Each under 15 words. */
  value_props: string[];
  /** 5 cold-outreach email subject lines. Each under 60 characters. Rendered as a copyable list. */
  email_subject_lines: string[];
  /** SEO meta description. Exactly 150 characters or fewer. */
  meta_description: string;
  /** Bio for Twitter/X and LinkedIn. 160 characters or fewer. */
  social_bio: string;
}
