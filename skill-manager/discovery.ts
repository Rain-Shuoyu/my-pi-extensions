import type { SkillManagerConfig } from "./config.ts";
import { getPolicy } from "./config.ts";

export interface SkillInfo { name: string; description: string; filePath: string; policy: ReturnType<typeof getPolicy>; missing?: boolean; duplicate?: boolean; sourceInfo?: unknown }
export function normalizeSkills(loaded: any[], config: SkillManagerConfig): SkillInfo[] {
  const result: SkillInfo[] = loaded.map((s) => ({ name: s.name, description: s.description ?? "", filePath: s.filePath ?? "", policy: getPolicy(config, s.name), sourceInfo: s.sourceInfo }));
  const names = new Set(result.map((s) => s.name));
  for (const [name, policy] of Object.entries(config.skills)) if (!names.has(name)) result.push({ name, description: "未找到此 skill", filePath: "", policy, missing: true });
  const counts = new Map<string, number>();
  for (const s of result) counts.set(s.name, (counts.get(s.name) ?? 0) + 1);
  for (const s of result) if ((counts.get(s.name) ?? 0) > 1) s.duplicate = true;
  return result.sort((a, b) => a.name.localeCompare(b.name));
}
export function findDuplicateNames(skills: SkillInfo[]): string[] { return [...new Set(skills.filter((s) => s.duplicate).map((s) => s.name))].sort(); }
