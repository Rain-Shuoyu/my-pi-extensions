import { strict as assert } from "node:assert";
import { BANNER, fitLine } from "./banner.ts";
import { filterAutoSkills, formatSection } from "./discovery.ts";

assert(BANNER.length >= 5);
assert(BANNER.some((line) => line.includes("█")));
assert(fitLine("abcdef", 4).length <= 4);
assert.equal(fitLine("abc", 4), "abc");
assert.deepEqual(filterAutoSkills([
  { name: "zeta", policy: "manual" },
  { name: "beta", policy: "auto" },
  { name: "alpha", policy: "auto" },
]), ["alpha", "beta"]);
assert.deepEqual(formatSection("Extensions", [], 10), ["Extensions", "  — none —"]);
assert.deepEqual(formatSection("Skills · Auto", ["a", "b", "c"], 3), ["Skills · Auto", "  • a", "  … and 2 more"]);
console.log("banner and discovery tests: PASS");
