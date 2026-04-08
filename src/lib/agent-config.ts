/**
 * Normalizes agent.config JSON from Prisma for UI display.
 * Shape matches `AGENT_DEFINITIONS` in `./agents`.
 */

export type AgentConfigView = {
  inputs: string[];
  outputs: string[];
  scheduleCron: string[];
};

export function parseAgentConfigForView(config: unknown): AgentConfigView {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return { inputs: [], outputs: [], scheduleCron: [] };
  }
  const c = config as Record<string, unknown>;
  const strings = (v: unknown) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string")
      : [];
  return {
    inputs: strings(c.inputs),
    outputs: strings(c.outputs),
    scheduleCron: strings(c.schedule),
  };
}
