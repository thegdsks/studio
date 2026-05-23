import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { AgentEvent } from '@studio/shared';

export function subscribeRun(
  runId: string,
  onEvent: (e: AgentEvent) => void,
  onComplete: () => void,
): AbortController {
  const controller = new AbortController();

  void fetchEventSource(`/api/runs/${runId}/events`, {
    signal: controller.signal,
    openWhenHidden: true,

    onmessage(ev) {
      if (!ev.data) return;
      try {
        const parsed = JSON.parse(ev.data) as AgentEvent;

        // Trigger completion callback on run-level complete event
        if (parsed.agent_id === '__run' && parsed.type === 'complete') {
          onComplete();
        }

        onEvent(parsed);
      } catch {
        // Non-JSON lines (heartbeat comments) are silently ignored
      }
    },

    onerror(err) {
      // Re-throw to stop retry loop on unrecoverable errors
      throw err;
    },
  });

  return controller;
}
