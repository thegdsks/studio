// Legacy shape (still returned by the director agent, nested under `briefing`)
export interface Inconsistency {
  severity: 'low' | 'medium' | 'high';
  issue: string;
  resolution: string;
}

export interface DirectorOutput {
  one_line_pitch: string;
  coherence_score: number;
  hot_take: string;
  unified_narrative: string;
  next_7_days: string[];
  inconsistencies: Inconsistency[];
  confidence_by_agent: Record<string, number>;
  briefing: DirectorBriefing;
}

// ── Executive Briefing ────────────────────────────────────────────────────────

export interface DirectorBriefing {
  headline_metric:  string;
  money_quote:      string;
  voiceover_script: string;
  talking_points:   [string, string, string, string, string];
  next_actions:     [string, string, string];
}

/**
 * Validates raw parsed JSON as DirectorBriefing.
 * Throws loudly on any missing or malformed field — no silent fallbacks.
 */
export function assertDirectorBriefing(raw: unknown): asserts raw is DirectorBriefing {
  if (!raw || typeof raw !== 'object') {
    throw new Error('[Director] briefing must be an object, got: ' + typeof raw);
  }
  const obj = raw as Record<string, unknown>;

  const requiredStrings: Array<keyof DirectorBriefing> = [
    'headline_metric',
    'money_quote',
    'voiceover_script',
  ];
  for (const key of requiredStrings) {
    if (typeof obj[key] !== 'string' || (obj[key] as string).trim() === '') {
      throw new Error(`[Director] briefing.${key} must be a non-empty string, got: ${JSON.stringify(obj[key])}`);
    }
  }

  if (!Array.isArray(obj['talking_points']) || obj['talking_points'].length !== 5) {
    throw new Error(
      `[Director] briefing.talking_points must be an array of exactly 5 strings, got: ${JSON.stringify(obj['talking_points'])}`,
    );
  }
  for (let i = 0; i < 5; i++) {
    if (typeof obj['talking_points'][i] !== 'string') {
      throw new Error(`[Director] briefing.talking_points[${i}] must be a string`);
    }
  }

  if (!Array.isArray(obj['next_actions']) || obj['next_actions'].length !== 3) {
    throw new Error(
      `[Director] briefing.next_actions must be an array of exactly 3 strings, got: ${JSON.stringify(obj['next_actions'])}`,
    );
  }
  for (let i = 0; i < 3; i++) {
    if (typeof obj['next_actions'][i] !== 'string') {
      throw new Error(`[Director] briefing.next_actions[${i}] must be a string`);
    }
  }
}
