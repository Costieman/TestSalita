import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const readJson = relative => JSON.parse(read(relative));
const fail = message => {
  throw new Error(message);
};

for (const file of ["bisaya-app-loader.js", "bisaya-review-regions.js", "profile-app.js", "exercise-fixes-v545.js", "service-worker.js"]) {
  new vm.Script(read(file), {filename:file});
}

const course = readJson("languages/cebuano/course.json");
const manifest = readJson("languages/cebuano/modules/manifest.json");
if (!Array.isArray(manifest.packs)) fail("The Cebuano module manifest must contain a packs array");
if (new Set(manifest.packs).size !== manifest.packs.length) fail("Duplicate module-pack filenames found in the manifest");

const packs = manifest.packs.map(name => readJson(`languages/cebuano/modules/${name}`));

if (course.courseId !== "cebuano") fail("courseId must be cebuano");
if (!Array.isArray(course.map) || course.map.length !== 13) fail("The Bisaya map must contain exactly 13 locations");

const mapIds = course.map.map(place => place.id);
if (new Set(mapIds).size !== mapIds.length) fail("Duplicate map IDs found");

const reviewMap = course.map.filter(place => place.type);
const expectedReviewMap = [
  ["MAP-11", "Memory Camp", "review"],
  ["MAP-12", "Echo Cave", "audio-review"],
  ["MAP-13", "Campfire Review", "final-review"]
];
if (reviewMap.length !== expectedReviewMap.length) fail("The Bisaya map must contain exactly three review regions");
expectedReviewMap.forEach(([id, region, type], index) => {
  const actual = reviewMap[index];
  if (!actual || actual.id !== id || actual.region !== region || actual.type !== type) {
    fail(`Review region ${id} is missing or out of order`);
  }
});

const moduleIds = course.modules.map(module => module.id);
if (new Set(moduleIds).size !== moduleIds.length) fail("Duplicate module IDs found");
const moduleSet = new Set(moduleIds);

const packModuleIds = packs.map(pack => pack.moduleId);
if (new Set(packModuleIds).size !== packModuleIds.length) fail("Duplicate module IDs found across module packs");

for (const pack of packs) {
  if (!moduleSet.has(pack.moduleId)) fail(`Unknown module pack: ${pack.moduleId}`);
  if (!Array.isArray(pack.items)) fail(`Module ${pack.moduleId} has no items array`);
  if (!pack.dialogue || !Array.isArray(pack.dialogue.lines)) fail(`Module ${pack.moduleId} has no valid dialogue`);
  if (pack.reviewStatus !== "native-review-required") fail(`Module ${pack.moduleId} must remain marked for native review`);
}

const expectedPackOrder = moduleIds.filter(id => id !== "greetings" && packModuleIds.includes(id));
if (JSON.stringify(packModuleIds) !== JSON.stringify(expectedPackOrder)) {
  fail(`Module packs must follow map order: expected ${expectedPackOrder.join(", ")}`);
}

const items = [...course.items, ...packs.flatMap(pack => pack.items)];
const itemIds = items.map(item => item.id);
if (new Set(itemIds).size !== itemIds.length) fail("Duplicate Cebuano item IDs found");

for (const item of items) {
  if (!item.id?.startsWith("ceb_")) fail(`Cebuano item ID must start with ceb_: ${item.id}`);
  if (!moduleSet.has(item.module)) fail(`Item ${item.id} references unknown module ${item.module}`);
  if (!item.meaning) fail(`Item ${item.id} has no English meaning`);
  if (!(item.term || item.root)) fail(`Item ${item.id} has no term or root`);
  if (!item.analysis?.tokens || !Array.isArray(item.analysis.tokens)) fail(`Item ${item.id} has no token analysis`);
}

const modulesWithContent = new Set(items.map(item => item.module));
let reachedUnreleasedModule = false;
for (const moduleId of moduleIds) {
  const released = modulesWithContent.has(moduleId);
  if (!released) reachedUnreleasedModule = true;
  if (released && reachedUnreleasedModule) fail(`Released module ${moduleId} appears after an unreleased map region`);
}

const exerciseGroups = [course.starterExercises || [], ...packs.map(pack => pack.starterExercises || [])];
const exercises = exerciseGroups.flat();
const exerciseIds = exercises.map(exercise => exercise.id);
if (new Set(exerciseIds).size !== exerciseIds.length) fail("Duplicate Cebuano exercise IDs found");

for (const exercise of exercises) {
  if (!exercise.id?.startsWith("ceb_")) fail(`Cebuano exercise ID must start with ceb_: ${exercise.id}`);
  if (exercise.type === "sentence-builder") {
    if (!Array.isArray(exercise.wordBank) || exercise.wordBank.length !== 6) {
      fail(`Sentence builder ${exercise.id} must contain exactly six word-bank tokens`);
    }
    if (!Array.isArray(exercise.answerTokens) || exercise.answerTokens.length < 1) {
      fail(`Sentence builder ${exercise.id} has no answer token sequence`);
    }
    for (const token of exercise.answerTokens) {
      if (!exercise.wordBank.includes(token)) fail(`Sentence builder ${exercise.id} answer token is missing from its word bank: ${token}`);
    }
  }
  for (const itemId of exercise.itemIds || []) {
    if (!itemIds.includes(itemId)) fail(`Exercise ${exercise.id} references unknown item ${itemId}`);
  }
}

const engine = read("app.js");
for (const marker of [
  "const MODULES =",
  "const MODULE_META =",
  "const ITEMS =",
  "const DIALOGUES =",
  "const BOSS_ITEMS =",
  "const BADGES =",
  "async function handsFreeSpeak",
  "async function speakFilipino",
  "async function checkVoiceService",
  "function removeSelectedWord(id)",
  "function selectBuilderWord(id)"
]) {
  if (!engine.includes(marker)) fail(`Shared engine marker missing: ${marker}`);
}

const exerciseFixes = read("exercise-fixes-v545.js");
for (const marker of [
  "__salitaQuestSentenceBuilderInteractionRecoveryInstalled",
  "updateSentenceBuilderUIWithReliableTouchTargets",
  "dataset.builderSelectedIndex",
  "removeSelectedWord(id)",
  "selectBuilderWord(tile.id)",
  "touch-action:manipulation"
]) {
  if (!exerciseFixes.includes(marker)) fail(`Bisaya sentence-builder interaction marker missing: ${marker}`);
}
if (!exerciseFixes.includes('document.addEventListener("click", event =>')) {
  fail("Sentence-builder recovery must use delegated click handling for generated Bisaya word tiles");
}

const loader = read("bisaya-app-loader.js");
if (loader.includes('/api/speech')) fail("Bisaya loader must not call the Tagalog speech endpoint");
if (!loader.includes('"ceb-PH"')) fail("Bisaya loader must specify the Cebuano language tag");
if (!loader.includes('loadScript("./exercise-fixes-v545.js')) fail("Bisaya loader must load the sentence-builder interaction fixes");

const reviewRuntime = read("bisaya-review-regions.js");
for (const marker of [
  "Memory Camp",
  "Echo Cave",
  "Campfire Review",
  "startMemoryCamp",
  "openEchoCave",
  "startCampfireReview",
  'switchView("audioReview")',
  "BOSS_ITEMS.splice"
]) {
  if (!reviewRuntime.includes(marker)) fail(`Review-region runtime marker missing: ${marker}`);
}
if (reviewRuntime.includes('/api/speech') || reviewRuntime.includes('fil-PH')) {
  fail("Review regions must not introduce Tagalog speech or speech endpoints");
}
const challengeStart = reviewRuntime.indexOf("const FINAL_CHALLENGE_ITEMS");
const challengeEnd = reviewRuntime.indexOf("function reviewReadiness", challengeStart);
const challengeBlock = reviewRuntime.slice(challengeStart, challengeEnd);
const challengeCount = (challengeBlock.match(/\bprompt:/g) || []).length;
if (challengeCount !== 10) fail(`Campfire Review must contain exactly ten challenge questions; found ${challengeCount}`);

const profileApp = read("profile-app.js");
if (!profileApp.includes("bisaya-review-regions.js")) fail("The Bisaya profile runtime must load the review-region script");

const index = read("index.html");
for (const marker of [
  "Which language will you be learning today?",
  'data-course-choice="cebuano"',
  'data-course-choice="tagalog"',
  "renderCourseChoice(active)",
  "loadProgress(saved, courseId)",
  'courseId === "cebuano"'
]) {
  if (!index.includes(marker)) fail(`Pre-placement language choice marker missing: ${marker}`);
}
if (index.includes('window.location.replace(`app.html?profile=${encodeURIComponent(active.id)}`)')) {
  fail("An active learner must see the language choice instead of being sent directly to Tagalog");
}

const serviceWorker = read("service-worker.js");
for (const packName of manifest.packs) {
  const expectedPath = `./languages/cebuano/modules/${packName}`;
  if (!serviceWorker.includes(expectedPath)) fail(`Offline cache is missing module pack: ${expectedPath}`);
}
if (!serviceWorker.includes("./bisaya-review-regions.js")) fail("Offline cache is missing the Bisaya review-region runtime");
if (!serviceWorker.includes("./exercise-fixes-v545.js")) fail("Offline cache is missing the sentence-builder interaction fixes");

console.log(`Validated ${course.map.length} locations, ${course.modules.length} modules, ${items.length} items, ${exercises.length} starter exercises, removable Bisaya sentence words, pre-placement language choice, and ${reviewMap.length} review regions.`);