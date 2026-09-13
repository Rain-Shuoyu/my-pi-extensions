import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type Policy = "auto" | "manual" | "blocked";
export interface SkillManagerConfig { version: 1; skills: Record<string, Policy> }
export const DEFAULT_CONFIG: SkillManagerConfig = { version: 1, skills: {} };

function valid(value: unknown): value is SkillManagerConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as any;
  if (v.version !== 1 || !v.skills || typeof v.skills !== "object" || Array.isArray(v.skills)) return false;
  return Object.entries(v.skills).every(([name, policy]) => name.length > 0 && typeof policy === "string" && ["auto", "manual", "blocked"].includes(policy));
}

export function getPolicy(config: SkillManagerConfig, name: string): Policy { return config.skills[name] ?? "auto"; }

export async function saveConfig(path: string, config: SkillManagerConfig): Promise<void> {
  if (!valid(config)) throw new Error("Invalid skill manager configuration");
  await mkdir(dirname(path), { recursive: true });
  const temp = join(dirname(path), `.${path.split("/").pop()}.tmp-${process.pid}-${Date.now()}`);
  await writeFile(temp, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, path);
}

export async function loadConfig(path: string): Promise<SkillManagerConfig> {
  let raw: string;
  try { raw = await readFile(path, "utf8"); }
  catch (e: any) { if (e?.code === "ENOENT") return { version: 1, skills: {} }; throw e; }
  try {
    const parsed = JSON.parse(raw);
    if (!valid(parsed)) throw new Error("Invalid schema");
    return { version: 1, skills: { ...parsed.skills } };
  } catch (e) {
    const backup = `${path}.corrupt-${Date.now()}`;
    try { await rename(path, backup); } catch {}
    await saveConfig(path, DEFAULT_CONFIG);
    return { version: 1, skills: {} };
  }
}
