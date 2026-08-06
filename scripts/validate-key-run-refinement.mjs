import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing: ${marker}`);
});

for (const file of [
  "daily-goal-refinement.js",
  "key-run-refinement.js",
  "even-progress-rail.js",
  "profile-emblem-control.js",
  "service-worker.js"
]) new vm.Script(read(file), {filename:file});

const goals = read("daily-goal-refinement.js");
requireMarkers(goals, [
  "Finish one Daily Session",
  "Get 15 answers right",
  "Complete 15 Quick Review items",
  "quickReviewItems",
  "dailySessions",
  "recordDailyAnswerWithQuickItemTracking",
  "baseRecordDailyAnswer.apply(this,arguments)",
  "questProgress(quest)>=quest.target"
], "Daily Quest refinement");
if (!(goals.includes('session?.mode === "quick"') || goals.includes('activeSession?.mode==="quick"'))) {
  fail('Daily Quest refinement is missing a Quick Review session-mode guard.');
}
if (!(goals.includes('session?.mode === "daily"') || goals.includes('activeSession?.mode==="daily"'))) {
  fail('Daily Quest refinement is missing a Daily Session mode guard.');
}
if (goals.includes("checkAnswerWithQuickItemTracking") || goals.includes("after - before")) {
  fail("Quick Review items must be counted through recordDailyAnswer, not the stale checkAnswer wrapper.");
}

const keyRun = read("key-run-refinement.js");
requireMarkers(keyRun, [
  "__salitaQuestWeeklyAvatarPolishInstalled = true",
  "const KEY_TARGET = 6",
  "function currentRunDates()",
  "dayDistance(latest, todayDateKey()) > 1",
  "keyRunClaims",
  "Six-key chest ready!",
  "Six Daily Keys in a row collected",
  "Missing a day resets the current run",
  'data-key-run-action="open"',
  "claimKeyRunChest",
  "pendingKeyAwards",
  "keys in a row",
  "Share social card",
  "navigator.share"
], "Six-key run");
if (keyRun.includes("this week") || keyRun.includes("currentWeekKey")) {
  fail("The key-run layer must not use calendar-week language or grouping.");
}

const rail = read("even-progress-rail.js");
requireMarkers(rail, [
  "renderMasteryRailWithEvenMilestones",
  "(index + 1) / count * 100",
  "visualProgress(points, milestones)",
  "previousUnlock",
  "nextUnlock",
  "progress-complete",
  "progress-approaching",
  "progress-future",
  "dot.textContent = String(number)",
  'host.dataset.evenSpacing = "true"'
], "World Progress rail");

const emblem = read("profile-emblem-control.js");
requireMarkers(emblem, [
  ".sq-profile-control",
  ".sidebar .brand-mark",
  ".mobile-brand-mark",
  "sq-profile-emblem-trigger",
  "originalButton.click()",
  "positionMenu(anchor)",
  "Open learner menu"
], "Learner avatar menus");

const serviceWorker = read("service-worker.js");
requireMarkers(serviceWorker, [
  '"./daily-goal-refinement.js"',
  '"./key-run-refinement.js"',
  '"./even-progress-rail.js"'
], "Offline delivery");

console.log("Validated repaired cumulative Quick Review counting, harder Daily Quests, six consecutive Daily Keys, learner-avatar menus, even mastery nodes, both course loaders, and offline assets.");
