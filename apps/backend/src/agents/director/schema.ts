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
}
