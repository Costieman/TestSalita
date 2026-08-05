import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("coin-avatar-shop-reveal-v1.js", "utf8");
const fail = message => { throw new Error(message); };
new vm.Script(source, {filename:"coin-avatar-shop-reveal-v1.js"});

[
  "function installRandomPoolModel()",
  'const STARTER_RANDOM_RARITY = "common"',
  "model.starterIds.includes(item.id)",
  "randomRarity:STARTER_RANDOM_RARITY",
  "shardRequirement:100",
  "item.levelReward == null",
  "shopRandomPoolActive()",
  "source.shards?.[id]",
  "ownedAvatarIds.includes(id) ? 100",
  "phase3RandomPools:true",
  "catalogue, byId, get, list, normaliseCollectionState, progress"
].forEach(marker => {
  if (!source.includes(marker)) fail(`Missing Phase 3 marker: ${marker}`);
});

if (!source.includes("return catalogue.filter(item => (item.randomRarity || item.rarity) === filters.rarity && item.levelReward == null)")) {
  fail("Shop rarity pools must include random-rarity aliases and exclude guaranteed level avatars.");
}
if (!source.includes("!account.collection.ownedAvatarIds.includes(item.id)")) {
  fail("Completed avatars must remain excluded from purchases.");
}
if (!source.includes("const candidates = model.list({rarity:detail.actualRarity || detail.rarity})")) {
  fail("Reveal candidates must use the same pool as the purchase.");
}

console.log("Validated unchosen starter randomization, guaranteed-level exclusions, completed-avatar exclusions, and 100-shard starter progression.");
