import type { Policy } from "./config.ts";
import type { SkillInfo } from "./discovery.ts";
import { cyclePolicy } from "./policy.ts";
import { truncateToWidth } from "@earendil-works/pi-tui";

export interface UiState { query: string; filter: Policy | "all"; selected: number }
export function createUiState(): UiState { return { query: "", filter: "all", selected: 0 }; }
export function filterSkills(skills: SkillInfo[], state: UiState): SkillInfo[] {
  const q = state.query.trim().toLowerCase();
  return skills.filter((s) => (state.filter === "all" || s.policy === state.filter) && (!q || `${s.name} ${s.description}`.toLowerCase().includes(q)));
}
export function moveSelection(state: UiState, delta: number, count: number): UiState { return { ...state, selected: count ? (state.selected + delta + count) % count : 0 }; }
export function toggleSelectedPolicy(state: UiState, skills: SkillInfo[]): UiState {
  const current = skills[state.selected];
  if (current) current.policy = cyclePolicy(current.policy);
  return state;
}
export function formatSkillRow(skill: SkillInfo): string {
  const icon = skill.policy === "auto" ? "✓" : skill.policy === "manual" ? "◐" : "✕";
  const label = skill.policy === "auto" ? "自动激活" : skill.policy === "manual" ? "仅手动激活" : "完全禁止";
  return `${icon} ${skill.name} — ${label}${skill.missing ? " [未找到]" : ""}`;
}

function hasPolicyChanges(current: SkillInfo[], original: SkillInfo[]): boolean {
  const before = new Map(original.map((skill) => [skill.name, skill.policy]));
  return current.some((skill) => before.get(skill.name) !== skill.policy);
}

async function scrollableSelect(ctx: any, title: string, options: string[], initialIndex = 0): Promise<{ value: string; index: number } | undefined> {
  return ctx.ui.custom((tui: any, theme: any, _keybindings: any, done: (value: { value: string; index: number } | undefined) => void) => {
    let selected = Math.max(0, Math.min(options.length - 1, initialIndex));
    let offset = Math.max(0, selected - 4);
    const visible = Math.max(5, Math.min(15, (tui.terminal?.rows ?? 24) - 8));
    const move = (delta: number) => {
      selected = Math.max(0, Math.min(options.length - 1, selected + delta));
      if (selected < offset) offset = selected;
      if (selected >= offset + visible) offset = selected - visible + 1;
    };
    return {
      render: (width: number) => {
        const end = Math.min(options.length, offset + visible);
        const lines = [theme.fg("accent", title), theme.fg("muted", `j/k 或 ↑↓ 导航 · Enter 选择 · Esc 取消`)];
        if (offset > 0) lines.push(theme.fg("muted", "  ↑ 还有更多"));
        for (let i = offset; i < end; i++) {
          const prefix = i === selected ? theme.fg("accent", "→ ") : "  ";
          lines.push(truncateToWidth(prefix + options[i], width));
        }
        if (end < options.length) lines.push(theme.fg("muted", "  ↓ 还有更多"));
        lines.push(theme.fg("muted", `  ${selected + 1}/${options.length}`));
        return lines;
      },
      handleInput: (data: string) => {
        if (data === "j" || data === "\u001b[B") move(1);
        else if (data === "k" || data === "\u001b[A") move(-1);
        else if (data === "\r" || data === "\n") done({ value: options[selected], index: selected });
        else if (data === "\u001b") done(undefined);
        tui.requestRender();
      },
      invalidate: () => {},
    };
  });
}

export async function choosePolicies(ctx: any, skills: SkillInfo[]): Promise<SkillInfo[] | undefined> {
  let current = skills.map((s) => ({ ...s }));
  let cursorIndex = 0;
  while (true) {
    const result = await scrollableSelect(ctx, "Skill 管理（选择后编辑状态）", [
      "🔍 搜索",
      "编辑状态（明确选择）",
      ...current.map(formatSkillRow),
      "💾 保存并退出",
      "取消",
    ], cursorIndex);
    if (!result) {
      if (hasPolicyChanges(current, skills)) {
        const save = await ctx.ui.confirm("保存更改？", "你修改的 skill 状态尚未保存。保存吗？");
        if (save) return current;
      }
      return undefined;
    }
    cursorIndex = result.index;
    const selected = result.value;
    if (selected === "取消") return undefined;
    if (selected === "💾 保存并退出") return current;
    if (selected === "🔍 搜索") {
      const q = await ctx.ui.input("搜索 skill", "名称或描述");
      if (q !== undefined) current = skills.map((s) => ({ ...s })).filter((s) => `${s.name} ${s.description}`.toLowerCase().includes(q.toLowerCase()));
      cursorIndex = Math.min(cursorIndex, Math.max(0, current.length + 1));
      continue;
    }
    if (selected === "编辑状态（明确选择）") {
      const target = await ctx.ui.select("选择要编辑的 skill", current.map((s) => s.name));
      const explicit = current.findIndex((s) => s.name === target);
      if (explicit >= 0) {
        const choice = await ctx.ui.select(current[explicit].name, ["自动激活", "仅手动激活", "完全禁止", "返回"]);
        if (choice === "自动激活") current[explicit].policy = "auto";
        if (choice === "仅手动激活") current[explicit].policy = "manual";
        if (choice === "完全禁止") current[explicit].policy = "blocked";
      }
      continue;
    }
    const index = current.findIndex((s) => formatSkillRow(s) === selected);
    if (index >= 0) {
      current[index].policy = cyclePolicy(current[index].policy);
      ctx.ui.notify(`${current[index].name}：${current[index].policy}`, "info");
      // Two menu entries precede skills; preserve the selected skill after rerender.
      cursorIndex = index + 2;
    }
  }
}
