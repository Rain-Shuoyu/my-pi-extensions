export interface ContextSnapshot { tokens: number | null; contextWindow: number; percent: number | null }
export interface MetricsState {
  inputTokens: number; outputTokens: number; cacheRead: number; cacheWrite: number;
  requests: number; cacheHitPercent: number | null; cost: number;
  context: ContextSnapshot; model: string; thinkingLevel: string;
}

export function createMetrics(): MetricsState {
  return { inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheWrite: 0, requests: 0, cacheHitPercent: null, cost: 0, context: { tokens: null, contextWindow: 0, percent: null }, model: "—", thinkingLevel: "—" };
}
const numberOrZero = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;
export function applyUsage(state: MetricsState, usage: any): void {
  if (!usage || typeof usage !== "object") return;
  state.inputTokens += numberOrZero(usage.input);
  state.outputTokens += numberOrZero(usage.output);
  state.cacheRead += numberOrZero(usage.cacheRead);
  state.cacheWrite += numberOrZero(usage.cacheWrite);
  state.cost += numberOrZero(usage.cost?.total ?? usage.cost);
  state.requests += 1;
  const prompt = state.inputTokens + state.cacheRead + state.cacheWrite;
  state.cacheHitPercent = prompt > 0 ? state.cacheRead / prompt * 100 : null;
}
export function setContext(state: MetricsState, usage: any): void {
  const tokens = usage?.tokens === null ? null : numberOrZero(usage?.tokens);
  const contextWindow = numberOrZero(usage?.contextWindow);
  const percent = usage?.percent === null ? null : Math.max(0, Math.min(100, numberOrZero(usage?.percent)));
  state.context = { tokens, contextWindow, percent };
}
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value < 1000) return String(Math.round(value));
  if (value < 10000) return `${(value / 1000).toFixed(1)}k`;
  if (value < 1e6) return `${Math.round(value / 1000)}k`;
  if (value < 1e7) return `${(value / 1e6).toFixed(1)}M`;
  return `${Math.round(value / 1e6)}M`;
}
export function formatPercent(value: number | null): string { return value === null || !Number.isFinite(value) ? "—" : `${value.toFixed(1)}%`; }
export function formatCost(value: number): string { return Number.isFinite(value) ? `$${value.toFixed(3)}` : "—"; }
