import { readFile, readdir } from "node:fs/promises";
import { fitLine } from "./banner.ts";

export interface SkillRecord { name: string; policy: string }

export function filterAutoSkills(skills: SkillRecord[]): string[] {
  return skills.filter((skill) => skill.policy === "auto").map((skill) => skill.name).sort();
}

export function formatSection(title: string, items: string[], availableLines: number): string[] {
  const lines = [title];
  if (items.length === 0) return [...lines, "  — none —"];
  const budget = Math.max(0, availableLines);
  if (items.length <= Math.max(0, budget - 1)) return [...lines, ...items.map((item) => `  • ${item}`)];
  const shown = Math.max(0, budget - 2);
  lines.push(...items.slice(0, shown).map((item) => `  • ${item}`));
  lines.push(`  … and ${items.length - shown} more`);
  return lines;
}

export async function discoverExtensions(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

export async function readAutoSkills(path: string, availableNames: string[] = []): Promise<string[]> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8"));
    const configured = parsed && typeof parsed === "object" && parsed.skills && typeof parsed.skills === "object" ? parsed.skills : {};
    const names = availableNames.length ? availableNames : Object.keys(configured);
    return filterAutoSkills(names.map((name) => ({ name, policy: String(configured[name] ?? "auto") })));
  } catch {
    // When the policy file is missing, known skills use the manager's auto default.
    return filterAutoSkills(availableNames.map((name) => ({ name, policy: "auto" })));
  }
}

export function fitList(lines: string[], width: number): string[] {
  return lines.map((line) => fitLine(line, width));
}
