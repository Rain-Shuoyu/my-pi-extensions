import { formatCost, formatCount, formatPercent, type MetricsState } from "./metrics.ts";

const ANSI = /\x1b\[[0-?]*[ -/]*[@-~]/g;
const visibleWidth = (text: string) => text.replace(ANSI, "").length;
const truncateToWidth = (text: string, width: number, ellipsis = "…") => {
  if (visibleWidth(text) <= width) return text;
  const plain = text.replace(ANSI, "");
  return plain.slice(0, Math.max(0, width - ellipsis.length)) + ellipsis;
};

const BAR_WIDTH = 20;
export function renderProgressBar(percent: number | null, theme: any): string {
  const safe = percent === null || !Number.isFinite(percent) ? 0 : Math.max(0, Math.min(100, percent));
  const filled = Math.round(safe / 100 * BAR_WIDTH);
  const color = safe >= 95 ? "error" : safe >= 80 ? "warning" : "success";
  return theme.fg(color, "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled));
}

export function renderFooterLines(state: MetricsState, width: number, theme: any): string[] {
  const input = theme.fg("error", `↑ ${formatCount(state.inputTokens)}`);
  const output = theme.fg("success", `↓ ${formatCount(state.outputTokens)}`);
  const cache = state.cacheHitPercent === null ? "—" : formatPercent(state.cacheHitPercent);
  const first = `${input}  ${output}    Requests ${formatCount(state.requests)} · Cache hit ${cache} · ${formatCost(state.cost)}`;
  const contextLimit = formatCount(state.context.contextWindow);
  const percent = formatPercent(state.context.percent);
  const context = `Context usage  ${renderProgressBar(state.context.percent, theme)}  ${percent} / ${contextLimit}`;
  const model = state.model === "—" ? "—" : state.model;
  const thinking = state.thinkingLevel === "—" ? "—" : state.thinkingLevel;
  const right = `${model} · ${thinking}`;
  const combined = `${context}       ${right}`;
  // Keep the context metrics first; the optional model suffix yields on narrow terminals.
  const second = visibleWidth(combined) <= width ? combined : truncateToWidth(context, width, "…");
  return [truncateToWidth(first, width, "…"), second];
}

export function createFooterComponent(getState: () => MetricsState, theme: any): any {
  return { render: (width: number) => renderFooterLines(getState(), width, theme), invalidate() {}, dispose() {} };
}
