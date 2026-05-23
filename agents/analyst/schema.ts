/**
 * AnalystOutput: Produced by the Analyst agent.
 * The frontend renders competitor cards, a 2D positioning matrix chart,
 * TAM callout, and the defensibility score gauge.
 */
export interface Competitor {
  /** Competitor brand name. */
  name: string;
  /** Official website URL. */
  url: string;
  /** How they position themselves. 1-2 sentences. */
  positioning: string;
  /** Pricing structure, e.g. "Free tier, $49/mo Pro, $199/mo Business". */
  pricing: string;
  /** Their single strongest competitive advantage. */
  strength: string;
  /** Their most cited weakness or gap. */
  weakness: string;
  /** Public funding stage and amount if available, e.g. "Series A, $8M (2023)". Use "Bootstrapped" or "Unknown" if not public. */
  funding_signal: string;
  /** Rough employee count from public sources, e.g. "~40 employees". Use "Unknown" if not public. */
  headcount_estimate: string;
  /** One specific feature or capability they do better than anyone else. */
  unique_feature: string;
}

export interface AnalystOutput {
  /** 2-3 direct or indirect competitors identified via Google Search grounding. */
  competitors: Competitor[];
  /** The specific underserved gap this startup addresses. 2-3 sentences. */
  market_gap: string;
  /** Strategic advice on how to win. 3-5 actionable sentences. */
  recommendation: string;

  /** Rough total addressable market estimate. Rendered as a highlighted stat. */
  tam_estimate: {
    /** The number or range, e.g. "$4.2B" or "$1B-$3B". */
    number: string;
    /** 2-3 sentences on how you arrived at this estimate and what sources or methodology you used. */
    explanation: string;
  };
  /** 2-4 word category label for positioning, e.g. "AI-native referral CRM". */
  category_label: string;
  /**
   * 2D positioning matrix for frontend visualization.
   * Values on each axis run 0-100. The user's startup must be included as a placement.
   */
  positioning_matrix: {
    /** Label for the horizontal axis, e.g. "Price (Low to High)". */
    x_axis: string;
    /** Label for the vertical axis, e.g. "Automation Level (Manual to Fully Automated)". */
    y_axis: string;
    /** Each player's position on the 2D grid. Include the user's startup. */
    placements: Array<{
      /** Name of the company or "Your Startup". */
      name: string;
      /** Position on x_axis, 0-100. */
      x: number;
      /** Position on y_axis, 0-100. */
      y: number;
    }>;
  };
  /**
   * How defensible the startup's competitive moat is, 0-100.
   * 80-100: strong moat (proprietary data, network effects, regulatory barriers).
   * 50-79: moderate (some switching costs or brand loyalty).
   * 0-49: weak (easily copied, no structural advantages).
   * Rendered as a gauge chart.
   */
  defensibility_score: number;
}
