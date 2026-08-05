import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };

const source = read("weekly-avatar-shard-rewards-v1.js");
const css = read("weekly-avatar-shard-rewards-v1.css");
const hotfix = read("src/features/avatar/avatar-progression-model-v551.js");
const coordinator = read("avatar-progression-hotfix-v551.js");
const loader = read("profile-emblem-control.js");

new vm.Script(source, {filename:"weekly-avatar-shard-rewards-v1.js"});
new vm.Script(hotfix, {filename:"src/features/avatar/avatar-progression-model-v551.js"});
new vm.Script(coordinator, {filename:"avatar-progression-hotfix-v551.js"});
new vm.Script(loader, {filename:"profile-emblem-control.js"});

for (const required of [
  "const KEY_TARGET = 6",
  'new Set(["common", "uncommon", "rare"])',
  "model.weeklyShardAward(item.rarity)",
  "data-weekly-avatar-target",
  "No avatar is selected randomly",
  "weekly.claims[weekKey]",
  "profile.avatarWeeklyRewards",
  "collection.pendingUnlocks.push",
  "salita:avatar-collection-changed",
  "stopImmediatePropagation",
  "migratedLegacy:true"
]) {
  if (!source.includes(required)) fail(`Weekly reward runtime is missing ${required}`);
}

if (/Math\.random|randomIndex|chooseWeeklyReward/.test(source)) {
  fail("Weekly avatar rewards must not use random assignment");
}

for (const required of [
  "Common</strong> +100 · 1 week",
  "Uncommon</strong> +50 · 2 weeks",
  "Rare</strong> +25 · 4 weeks",
  "Complete all four Daily Quests",
  "account-wide key"
]) {
  if (!source.includes(required)) fail(`Weekly reward copy is missing ${required}`);
}

for (const required of [
  ".weekly-avatar-target-grid",
  ".weekly-avatar-target-grey",
  "filter:grayscale(1)",
  "clip-path:inset(var(--weekly-mask-top,100%) 0 0 0)",
  "@media(max-width:700px)"
]) {
  if (!css.includes(required)) fail(`Weekly reward styles are missing ${required}`);
}

for (const required of [
  'rarity:starter ? "common" : source.rarity',
  'weeklyRarity:starter ? "common"',
  "shardRequirement:starter ? 100",
  'collectionGroups:starter ? Object.freeze(["starter", "common"])'
]) {
  if (!hotfix.includes(required)) fail(`Starter weekly eligibility is missing ${required}`);
}

if (!loader.includes('const RELEASE_VERSION = "5.5.6"')) fail("Shared profile runtime release version is not 5.5.6");
if (!loader.includes("weekly-avatar-shard-rewards-v1.css") || !loader.includes("addStylesheet")) {
  fail("Shared profile runtime does not load weekly shard reward styles");
}
if (!loader.includes("weekly-avatar-shard-rewards-v1.js") || !loader.includes('loadScript("weekly"')) {
  fail("Shared profile runtime does not load weekly shard reward logic");
}
if (!loader.includes("await window.SalitaAvatarHotfixReady")) fail("Weekly rewards load before starter/common progression data");

console.log("Weekly avatar reward validation passed: six account-wide keys, collectible starters, free target choice, 100/50/25 shards and no randomness.");
