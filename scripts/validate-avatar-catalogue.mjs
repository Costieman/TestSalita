import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const source = fs.readFileSync(new URL("avatar-catalogue-v1.js", root), "utf8");
const fail = message => { throw new Error(message); };

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, {filename:"avatar-catalogue-v1.js"});

const catalogue = sandbox.SalitaAvatarCatalogue;
const model = sandbox.SalitaAvatarModel;
if (!Array.isArray(catalogue)) fail("Avatar catalogue was not created");
if (!model) fail("Avatar data model was not created");
if (catalogue.length !== 48) fail(`Expected 48 avatars, found ${catalogue.length}`);
if (!Object.isFrozen(catalogue) || catalogue.some(item => !Object.isFrozen(item))) fail("Catalogue records must be immutable");

const ids = catalogue.map(item => item.id);
if (new Set(ids).size !== ids.length) fail("Avatar IDs must be unique");
const requiredLegacyIds = ["tarsier", "eagle", "tamaraw", "peacock", "orchid", "jade", "rafflesia", "anahaw"];
for (const id of requiredLegacyIds) if (!ids.includes(id)) fail(`Legacy avatar ID was not preserved: ${id}`);

const expectedRarities = {starter:4, common:8, uncommon:15, rare:20, special:1};
for (const [rarity, expected] of Object.entries(expectedRarities)) {
  const actual = catalogue.filter(item => item.rarity === rarity).length;
  if (actual !== expected) fail(`Expected ${expected} ${rarity} avatars, found ${actual}`);
}
if (catalogue.filter(item => item.rarity === "rare").some(item => item.category !== "animal")) fail("Every rare avatar must be an animal");

const expectedStarters = ["anahaw", "orchid", "jade", "rafflesia"];
if (JSON.stringify([...model.starterIds]) !== JSON.stringify(expectedStarters)) fail("Starter avatar IDs are incorrect");
if (catalogue.filter(item => item.rarity === "starter").some(item => item.shardRequirement !== 0)) fail("Starter avatars must not require shards");
if (catalogue.filter(item => ["common", "uncommon", "rare"].includes(item.rarity)).some(item => item.shardRequirement !== 100)) fail("Collectible avatars must require 100 shards");
if (model.weeklyShardAward("common") !== 100 || model.weeklyShardAward("uncommon") !== 50 || model.weeklyShardAward("rare") !== 25) fail("Weekly shard awards must be 100 / 50 / 25");

const expectedLevels = [10,20,30,40,50,60,70,80,90,99];
for (const level of expectedLevels) if (!model.levelRewards[level]) fail(`Missing Level ${level} reward`);
if (model.levelRewards[99] !== "golden_salita_crest") fail("Level 99 must award the Golden Salita Crest");
if (new Set(Object.values(model.levelRewards)).size !== expectedLevels.length) fail("Level rewards must be unique");

for (const item of catalogue) {
  for (const field of ["id", "name", "category", "rarity", "unlockSource", "image"]) {
    if (!item[field]) fail(`${item.id || "Unknown avatar"} is missing ${field}`);
  }
  if (!fs.existsSync(new URL(item.image, root))) fail(`Missing avatar asset: ${item.image}`);
}

if (model.normaliseId("Philippine Eagle") !== "eagle") fail("Philippine Eagle alias failed");
if (model.normaliseId("Waling-Waling Orchid") !== "orchid") fail("Waling-Waling alias failed");
if (model.normaliseId("Luzon Bleeding Heart") !== "luzon_bleeding_heart_dove") fail("Bleeding-heart alias failed");
if (model.normaliseId("Butanding") !== "whale_shark_butanding") fail("Butanding alias failed");

const migrated = model.normaliseCollectionState({shards:{narra:150,unknown:40}}, "eagle");
if (migrated.equippedAvatarId !== "eagle") fail("Existing equipped avatar was not preserved");
if (!migrated.ownedAvatarIds.includes("eagle")) fail("Existing equipped avatar must become owned");
if (migrated.shards.eagle !== 100) fail("Owned collectible must have full shards");
if (migrated.shards.narra !== 100 || "unknown" in migrated.shards) fail("Shard values were not normalised");
if (migrated.needsStarterChoice) fail("A migrated learner with an avatar must not need a starter choice");

const newLearner = model.normaliseCollectionState();
if (!newLearner.needsStarterChoice || newLearner.equippedAvatarId !== null) fail("A new learner must require a starter choice");
const partial = model.progress("medinilla", {shards:{medinilla:50}});
if (partial.percent !== 50 || partial.owned) fail("Partial avatar progress is incorrect");

console.log("Avatar catalogue validation passed: 48 records, stable legacy IDs, rarity rules, level rewards, shard rules and asset paths.");
