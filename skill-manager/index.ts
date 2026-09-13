import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadConfig, saveConfig, type SkillManagerConfig } from "./config.ts";
import { normalizeSkills } from "./discovery.ts";
import { isManualInvocationAllowed, isModelVisible } from "./policy.ts";
import { choosePolicies } from "./ui.ts";

const CONFIG_PATH = join(homedir(), ".pi", "agent", "skill-manager.json");
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function filterPrompt(prompt: string, skills: any[], config: SkillManagerConfig): string {
  let result = prompt;
  for (const skill of skills) {
    if (isModelVisible(config.skills[skill.name] ?? "auto")) continue;
    const name = escapeRegExp(skill.name);
    result = result.replace(new RegExp(`<skill>\\s*<name>${name}<\\/name>[\\s\\S]*?<\\/skill>\\s*`, "g"), "");
  }
  return result;
}

function skillNameFromInput(text: string): string | undefined {
  const match = text.trim().match(/^\/skill:([^\s]+)(?:\s|$)/);
  return match?.[1];
}

export default function skillManager(pi: ExtensionAPI) {
  let config: SkillManagerConfig = { version: 1, skills: {} };
  let knownSkills: any[] = [];
  void loadConfig(CONFIG_PATH).then((loaded) => { config = loaded; }).catch(() => {});

  pi.on("input", async (event, ctx) => {
    const name = skillNameFromInput(event.text);
    if (!name) return { action: "continue" as const };
    config = await loadConfig(CONFIG_PATH);
    if (!isManualInvocationAllowed(config.skills[name] ?? "auto")) {
      ctx.ui.notify(`Skill 已被完全禁止：${name}`, "warning");
      return { action: "handled" as const };
    }
    return { action: "continue" as const };
  });

  pi.on("before_agent_start", async (event) => {
    config = await loadConfig(CONFIG_PATH);
    const skills = event.systemPromptOptions.skills ?? [];
    knownSkills = skills;
    return { systemPrompt: filterPrompt(event.systemPrompt, skills, config) };
  });

  pi.registerCommand("skills", {
    description: "管理全局 skill 激活策略",
    handler: async (_args, ctx) => {
      config = await loadConfig(CONFIG_PATH);
      const commandSkills = pi.getCommands()
        .filter((command) => command.source === "skill")
        .map((command) => ({ name: command.name.replace(/^skill:/, ""), description: command.description ?? "", filePath: command.sourceInfo?.path ?? "" }));
      const loaded = knownSkills.length > 0 ? knownSkills : commandSkills;
      const records = normalizeSkills(loaded, config);
      const edited = await choosePolicies(ctx, records);
      if (!edited) return;
      const next: SkillManagerConfig = { version: 1, skills: {} };
      for (const skill of edited) next.skills[skill.name] = skill.policy;
      await saveConfig(CONFIG_PATH, next);
      config = next;
      ctx.ui.notify(`已保存 ${edited.length} 个 skill 的策略。请执行 /reload 使其生效。`, "info");
    },
  });
}

export { CONFIG_PATH, filterPrompt, skillNameFromInput };
