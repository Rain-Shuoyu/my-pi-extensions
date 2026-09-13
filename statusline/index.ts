import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { applyUsage, createMetrics, setContext, type MetricsState } from "./metrics.ts";
import { createFooterComponent } from "./footer.ts";

function syncHistory(state: MetricsState, ctx: any): void {
  for (const entry of ctx.sessionManager.getEntries()) {
    if (entry.type === "message" && entry.message.role === "assistant" && entry.message.usage) applyUsage(state, entry.message.usage);
    if ((entry.type === "compaction" || entry.type === "branch_summary") && entry.usage) applyUsage(state, entry.usage);
  }
}

export default function statusline(pi: ExtensionAPI) {
  let state: MetricsState | undefined;
  let requestRender: (() => void) | undefined;

  const refresh = (ctx: any) => {
    if (!state) return;
    setContext(state, ctx.getContextUsage?.());
    state.model = ctx.model?.id ?? "—";
    state.thinkingLevel = ctx.thinkingLevel ?? "—";
    requestRender?.();
  };

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    state = createMetrics();
    syncHistory(state, ctx);
    refresh(ctx);
    ctx.ui.setFooter((tui: any, theme: any) => {
      requestRender = () => tui.requestRender();
      return createFooterComponent(() => state ?? createMetrics(), theme);
    });
  });

  pi.on("message_end", async (event: any, ctx) => {
    if (!state || event.message?.role !== "assistant") return;
    applyUsage(state, event.message.usage);
    refresh(ctx);
  });

  pi.on("turn_end", async (_event, ctx) => refresh(ctx));
  pi.on("model_select", async (event: any, ctx) => {
    if (state) state.model = event.model?.id ?? ctx.model?.id ?? "—";
    refresh(ctx);
  });
  pi.on("thinking_level_select", async (event: any, ctx) => {
    if (state) state.thinkingLevel = event.level ?? ctx.thinkingLevel ?? "—";
    refresh(ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    if (ctx.mode === "tui") ctx.ui.setFooter(undefined);
    state = undefined;
    requestRender = undefined;
  });
}
