import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };

const catalogueSource = read("avatar-catalogue-v1.js");
const rewardSource = read("level-avatar-rewards-v1.js");
const loaderSource = read("profile-emblem-control.js");

new vm.Script(rewardSource, {filename:"level-avatar-rewards-v1.js"});
new vm.Script(loaderSource, {filename:"profile-emblem-control.js"});

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(catalogueSource, sandbox, {filename:"avatar-catalogue-v1.js"});
vm.runInContext(rewardSource, sandbox, {filename:"level-avatar-rewards-v1.js"});

const model = sandbox.SalitaAvatarModel;
const logic = sandbox.SalitaLevelAvatarRewardLogic;
if (!model || logic?.version !== 2) fail("Milestone reward model v2 did not initialise");

const expected = {
  10:"narra",
  20:"nipa_palm",
  30:"katmon",
  40:"buri_palm",
  50:"parol",
  60:"banaba",
  70:"bangka",
  80:"medinilla",
  90:"kulintang",
  99:"golden_salita_crest"
};

for (const [level, avatarId] of Object.entries(expected)) {
  if (model.levelRewards[level] !== avatarId) fail(`Level ${level} must award ${avatarId}`);
  const item = model.get(avatarId);
  if (Number(level) < 99 && !["common", "uncommon"].includes(item.rarity)) {
    fail(`Level ${level} reward must be common or uncommon`);
  }
}
if (model.get(expected[99]).rarity !== "special") fail("Level 99 reward must be special");

const beforeTen = logic.applyMilestoneRewards(9, {}, model, {now:"2026-01-01T00:00:00.000Z"});
if (beforeTen.awarded.length || beforeTen.acknowledged.length) fail("No avatar should be awarded before Level 10");

const levelFifty = logic.applyMilestoneRewards(50, {
  equippedAvatarId:"eagle",
  ownedAvatarIds:["eagle"],
  shards:{eagle:100}
}, model, {course:"tagalog", now:"2026-01-01T00:00:00.000Z"});
if (levelFifty.collection.equippedAvatarId !== "eagle") fail("Existing equipped avatar was not preserved");
if (levelFifty.awarded.length !== 5) fail("Level 50 must retroactively add five milestone avatars");
if (JSON.stringify([...levelFifty.collection.levelRewardsClaimed]) !== JSON.stringify([10,20,30,40,50])) {
  fail("Level 50 claimed milestones are incorrect");
}
for (const reward of levelFifty.awarded) {
  if (!levelFifty.collection.ownedAvatarIds.includes(reward.avatarId)) fail(`Missing owned avatar ${reward.avatarId}`);
  if (reward.avatar.shardRequirement && levelFifty.collection.shards[reward.avatarId] !== 100) fail(`Missing full shards for ${reward.avatarId}`);
  const pending = levelFifty.collection.pendingUnlocks.find(entry => entry.avatarId === reward.avatarId);
  if (!pending || pending.source !== "level_milestone" || pending.level !== reward.level) fail(`Missing pending unlock for ${reward.avatarId}`);
}

const repeated = logic.applyMilestoneRewards(50, levelFifty.collection, model);
if (repeated.awarded.length || repeated.acknowledged.length) fail("Milestone rewards must not be duplicated");

const alreadyOwned = logic.applyMilestoneRewards(10, {
  equippedAvatarId:"narra",
  ownedAvatarIds:["narra"],
  shards:{narra:100},
  pendingUnlocks:[]
}, model);
if (alreadyOwned.awarded.length !== 0 || alreadyOwned.acknowledged.length !== 1) fail("An already-owned milestone must be acknowledged without a duplicate unlock");
if (alreadyOwned.collection.pendingUnlocks.length !== 0) fail("Already-owned avatars must not receive duplicate pending unlocks");

const summit = logic.applyMilestoneRewards(99, {}, model);
if (summit.collection.levelRewardsClaimed.length !== 10) fail("Level 99 must claim all ten milestone rewards");
if (!summit.collection.ownedAvatarIds.includes("golden_salita_crest")) fail("Level 99 must unlock the Golden Salita Crest");
if (summit.awarded.some(reward => reward.level < 99 && !["common", "uncommon"].includes(reward.avatar.rarity))) {
  fail("Levels 10–90 must never award rare avatars");
}

const corrupted = {
  avatarId:"anahaw",
  avatarCollection:{
    equippedAvatarId:"anahaw",
    ownedAvatarIds:["anahaw","narra","nipa_palm"],
    shards:{narra:100,nipa_palm:100},
    levelRewardsClaimed:[10,20],
    pendingUnlocks:[
      {avatarId:"narra",source:"level_milestone",level:10},
      {avatarId:"nipa_palm",source:"level_milestone",level:20}
    ]
  },
  avatarMilestoneRewards:{claims:{10:{avatarId:"narra"},20:{avatarId:"nipa_palm"}}}
};
const repaired = logic.repairFutureMilestones(corrupted, 1, model);
if (!repaired.changed || corrupted.avatarCollection.levelRewardsClaimed.length) fail("Future milestone claims were not repaired");
if (corrupted.avatarCollection.ownedAvatarIds.includes("narra") || corrupted.avatarCollection.ownedAvatarIds.includes("nipa_palm")) {
  fail("Unsupported future milestone avatars were not removed");
}

for (const required of [
  "salitaQuestLocalProfilesV1",
  "levelRewardsClaimed",
  'source:"level_milestone"',
  "highestLevelObserved",
  "salita:avatar-collection-changed",
  "repairFutureMilestones",
  "repairedFutureLevels",
  "!window.__salitaQuestLevelProgressionV2Installed",
  "golden_salita_crest"
]) {
  if (!rewardSource.includes(required)) fail(`Milestone runtime is missing ${required}`);
}
if (/state\.xp\s*(?:\+|-|\*|\/)?=/.test(rewardSource)) fail("Milestone rewards must not alter XP or existing levels");
if (!loaderSource.includes('const RELEASE_VERSION = "5.5.1"')) fail("Shared profile runtime release version is not 5.5.1");
if (!loaderSource.includes("level-avatar-rewards-v1.js") || !loaderSource.includes('loadScript("level"')) {
  fail("Shared profile runtime does not load milestone rewards");
}
if (!loaderSource.includes("await window.SalitaAvatarHotfixReady")) fail("Milestones load before the safe model hotfix");

console.log("Level avatar reward validation passed: Levels 10–90 common/uncommon, Level 99 crest, real-level gating, future-claim repair and no duplicate awards.");
