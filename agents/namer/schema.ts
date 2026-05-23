/**
 * NamerOutput: Produced by the Namer agent.
 * The frontend renders each name as a card with domain badge,
 * vibe tag, pronunciation guide, and trademark risk indicator.
 */
export interface DomainOption {
  /** The brand name itself (lowercase, no spaces). */
  name: string;
  /** Primary .com domain to check. */
  domain: string;
  /** Whether the .com is available based on Domainr check. */
  available: boolean;
  /** Alternative TLD if .com is taken, e.g. "launchpadai.co". */
  alternative_tld?: string;
  /** 3-5 word description of what the name connotes. Rendered as a tag chip. */
  vibe: string;
  /** Phonetic spelling for easy pronunciation. Example: "KLAR-ee-tee". */
  pronunciation: string;
  /** Heuristic trademark risk based on name commonness and dictionary overlap. */
  trademark_risk: 'low' | 'medium' | 'high';
}

export interface NamerOutput {
  /** Exactly 5 name options ordered from most to least recommended. */
  names: DomainOption[];
}
