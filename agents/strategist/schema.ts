/**
 * StrategistOutput: Produced by the Strategist agent.
 * The frontend uses this to render the Strategy tab with positioning,
 * persona card, KPIs, and unfair advantage sections.
 */
export interface StrategistOutput {
  /** 1-2 sentence brand positioning statement. */
  positioning: string;
  /** Detailed description of the ideal customer profile. */
  icp: string;
  /** The core "job" the customer is hiring this product to do. */
  jtbd: string;
  /** Top 3 execution, market, or regulatory risks. Rendered as a warning list. */
  three_risks: string[];

  /** One-sentence "X for Y by Z" elevator pitch. Rendered as the hero pull-quote. */
  one_line_pitch: string;
  /** A single representative buyer persona. Rendered as a persona card. */
  target_persona: {
    /** Display name and role label, e.g. "Alex, Solo Founder". */
    name: string;
    /** Job title or archetype, e.g. "Bootstrapped SaaS Founder". */
    role: string;
    /** 3-5 pain points this person experiences today. Rendered as a bullet list. */
    pains: string[];
    /** 3-5 outcomes they want to achieve. Rendered as a bullet list. */
    gains: string[];
  };
  /** 3 KPIs the founder should track in the first 90 days. Rendered as a checklist. */
  success_metrics: string[];
  /** One paragraph on what gives this startup a durable edge. Rendered as a highlighted callout. */
  unfair_advantage: string;
}
