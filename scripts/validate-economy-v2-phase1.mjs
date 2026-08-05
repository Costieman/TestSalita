import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("daily-goal-refinement.js", "utf8");
const compact = source.replace(/\s+/g, "");
const fail = message => { throw new Error(message); };
const requireCompact = marker => {
  const expected = marker.replace(/\s+/g, "");
  if (!compact.includes(expected)) fail(`Missing Economy v2 marker: ${marker}`);
};

new vm.Script(source, {filename:"daily-goal-refinement.js"});

[
  'const ECONOMY_RELEASE="economy-v2-phase1"',
  "const DAILY_QUEST_REWARD=100",
  "const DAILY_CHEST_COINS=100",
  "const BOSS_REWARD_COINS=25",
  "const MAX_REWARDED_BOSSES_PER_DAY=2",
  'quickQuest.title="Complete 15 Quick Review items"',
  'correctQuest.title="Get 15 answers right"',
  'reviewQuest.title="Strengthen 3 learned items"',
  'sessionQuest.title="Finish one Daily Session"',
  "DAILY_QUESTS.forEach(quest=>{quest.reward=DAILY_QUEST_REWARD;})",
  "balancedReward=1",
  "data.comboHalfSteps%2===0?1:0",
  "data.rewardedBossesToday<MAX_REWARDED_BOSSES_PER_DAY",
  "state.coins+=BOSS_REWARD_COINS-20",
  "state.coins=Math.max(0,Number(state.coins||0)-20)",
  'title.textContent="Complete all 4 quests"',
  "if(correct&&!teachingItem&&activeExercise)",
  "const bossPassed=bossAttempt"
].forEach(requireCompact);

if ((source.match(/DAILY_QUEST_REWARD/g) || []).length < 6) fail("Daily quest rewards are not consistently governed by the 100-coin constant.");

console.log("Validated four 100-coin daily quests, a 100-coin chest, halved regular/combo rewards, and two daily 25-coin boss rewards.");
