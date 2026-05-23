// FROZEN CONTRACT — do not change without coordinating with all parallel agents/sessions.
// Backend orchestrator emits AgentEvents, frontend AgentCard consumes them.

export type AgentId =
  | 'strategist'
  | 'namer'
  | 'designer'
  | 'copywriter'
  | 'developer'
  | 'marketer'
  | 'growth'
  | 'legal'
  | 'analyst';

export type AgentStatus = 'queued' | 'running' | 'done' | 'error';

export interface AgentMeta {
  id: AgentId;
  name: string;
  emoji: string;
  description: string;
}

export const AGENT_REGISTRY: Record<AgentId, AgentMeta> = {
  strategist: { id: 'strategist', name: 'Strategist', emoji: '🎯', description: 'Positioning, ICP, JTBD' },
  namer:      { id: 'namer',      name: 'Namer',      emoji: '🪪', description: '5 brand names + live domain checks' },
  designer:   { id: 'designer',   name: 'Designer',   emoji: '🎨', description: 'Logo + UI mockup' },
  copywriter: { id: 'copywriter', name: 'Copywriter', emoji: '✍️', description: 'Hero, features, FAQ' },
  developer:  { id: 'developer',  name: 'Developer',  emoji: '💻', description: 'HTML + live deploy' },
  marketer:   { id: 'marketer',   name: 'Marketer',   emoji: '📣', description: 'X, Product Hunt, HN posts' },
  growth:     { id: 'growth',     name: 'Growth',     emoji: '🌱', description: '10 prospects (public-record only)' },
  legal:      { id: 'legal',      name: 'Legal',      emoji: '⚖️', description: 'Terms + Privacy drafts' },
  analyst:    { id: 'analyst',    name: 'Analyst',    emoji: '📊', description: 'Competitor teardown' },
};

export const AGENT_IDS: AgentId[] = [
  'strategist', 'namer', 'designer', 'copywriter', 'developer',
  'marketer', 'growth', 'legal', 'analyst',
];

export interface Agent {
  id: AgentId;
  name: string;
  emoji: string;
  status: AgentStatus;
  startedAt?: number;
  finishedAt?: number;
  streamedText: string;
  finalArtifact?: unknown;
  tools: string[];
  error?: string;
}

// SSE event union. The frontend switches on `type` and routes by `agent_id`.
// The `__run` synthetic id signals run-level events (completion).
export type AgentEvent =
  | { agent_id: AgentId; type: 'status'; payload: { status: AgentStatus } }
  | { agent_id: AgentId; type: 'chunk';  payload: { text: string } }
  | { agent_id: AgentId; type: 'result'; payload: { artifact: unknown } }
  | { agent_id: AgentId; type: 'error';  payload: { message: string } }
  | { agent_id: '__run'; type: 'complete'; payload: { run_id: string } };
