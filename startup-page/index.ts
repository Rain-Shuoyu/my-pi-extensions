import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { BANNER, fitLine } from "./banner.ts";
import { discoverExtensions, fitList, formatSection, readAutoSkills } from "./discovery.ts";

const EXTENSIONS_ROOT = join(homedir(), ".pi", "agent", "extensions");
const SKILL_CONFIG = join(homedir(), ".pi", "agent", "skill-manager.json");

function skillNamesFromCommands(pi: ExtensionAPI): string[] {
  return pi.getCommands()
    .filter((command) => command.source === "skill")
    .map((command) => command.name.replace(/^skill:/, ""))
    .filter(Boolean);
}

function renderPage(width: number, rows: number, theme: any, extensions: string[], skills: string[]): string[] {
  const banner = BANNER.map((line) => theme.fg("accent", fitLine(line, width)));
  const sectionBudget = Math.max(2, Math.floor(Math.max(4, rows - BANNER.length - 5) / 2));
  const extensionLines = formatSection("Extensions", extensions, sectionBudget);
  const skillLines = formatSection("Skills · Auto", skills, sectionBudget);
  const plain = [...banner, "", ...extensionLines, "", ...skillLines];
  return fitList(plain, width).slice(0, Math.max(1, rows - 1)).map((line, index) => {
    if (index < BANNER.length) return line;
    if (line === "Extensions" || line === "Skills · Auto") return theme.fg("accent", line);
    if (line.startsWith("  …") || line === "  — none —") return theme.fg("muted", line);
    return theme.fg("text", line);
  });
}

export default function startupPage(pi: ExtensionAPI) {
  pi.registerCommand("builtin-header", {
    description: "恢复 Pi 内置启动页",
    handler: async (_args, ctx) => {
      ctx.ui.setHeader(undefined);
      ctx.ui.notify("已恢复 Pi 内置启动页。", "info");
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    const availableSkills = skillNamesFromCommands(pi);
    const [extensions, skills] = await Promise.all([
      discoverExtensions(EXTENSIONS_ROOT),
      readAutoSkills(SKILL_CONFIG, availableSkills),
    ]);
    ctx.ui.setHeader((tui: any, theme: any) => ({
      render(width: number) {
        return renderPage(width, tui.terminal?.rows ?? 24, theme, extensions, skills);
      },
      invalidate() {},
    }));
  });
}

export { EXTENSIONS_ROOT, SKILL_CONFIG, renderPage, skillNamesFromCommands };
