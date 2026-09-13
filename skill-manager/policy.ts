import type { Policy, SkillManagerConfig } from "./config.ts";
import { getPolicy } from "./config.ts";

export const POLICIES: Policy[] = ["auto", "manual", "blocked"];
export function getEffectivePolicy(config: SkillManagerConfig, name: string): Policy { return getPolicy(config, name); }
export function cyclePolicy(policy: Policy): Policy { return POLICIES[(POLICIES.indexOf(policy) + 1) % POLICIES.length]; }
export function isModelVisible(policy: Policy): boolean { return policy === "auto"; }
export function isManualInvocationAllowed(policy: Policy): boolean { return policy !== "blocked"; }
