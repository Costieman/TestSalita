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
  "ui-quality-fixes.js",
  "incorrect-order-feedback.js",
  "src/adapters/exercise/incorrect-order-feedback-runtime-v1.js",
  "src/features/exercise/incorrect-order-feedback.js",
  "compact-desktop-layout.js",
  "src/features/interface/compact-desktop-layout.js",
  "mastery-feedback.js",
  "lesson-side-launcher.js",
  "mobile-session-refinement.js",
  "src/config/course-manifest.js",
  "src/app/course-bootstrap.js",
  "service-worker.js"
]) new vm.Script(read(file), {filename:file});

for (const htmlFile of ["index.html", "app.html", "bisaya.html"]) {
  const html = read(htmlFile);
  [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1].trim())
    .filter(Boolean)
    .forEach((source, index) => new vm.Script(source, {filename:`${htmlFile}#inline-${index + 1}`}));
}

requireMarkers(read("ui-quality-fixes.js"), [
  'id: "quick_twice"',
  "showAnswerPopWithLightFlash",
  "renderFeedbackWithWordBreakdown",
  "correct-word-breakdown",
  "Direct translation"
], "Shared UI runtime");

requireMarkers(read("src/features/exercise/incorrect-order-feedback.js"), [
  "captureSelectedTilePositions",
  "animateCorrectSentenceOrder",
  "runtime.applyCorrectOrder(orderedIds)",
  "aroundRenderFeedback"
], "Incorrect-order feedback");

const mastery = read("mastery-feedback.js");
requireMarkers(mastery, [
  "MIN_DURABLE_GAP_MS = 3 * 24 * 60 * 60 * 1000",
  "longTermMastery",
  "retentionGainForGap",
  "Built only by correct recall after 3+ days away."
], "Durable mastery");
if (mastery.includes("12+ hours") || mastery.includes("12 hours away")) fail("Durable mastery regressed to a twelve-hour gap.");

const launcher = read("lesson-side-launcher.js");
requireMarkers(launcher, [
  'data-launch-tab="daily"',
  'data-launch-tab="quick"',
  '<option value="15">15 questions</option>',
  'startSession("quick", false, {length})',
  "function phraseForCurrentExercise()",
  "currentExercise?.answers?.[0]",
  "function answerHasBeenGiven()",
  "function isEnglishToFilipinoProduction()",
  "productionBeforeAnswer",
  "if (!activeSession())",
  'audioButton.classList.add("hidden")',
  'answered ? "🔊 Hear the answer"',
  'longTerm.insertAdjacentElement("afterend", audioButton)'
], "Lesson pronunciation control");

const manifestContext = {window:{}};
vm.createContext(manifestContext);
vm.runInContext(read("src/config/course-manifest.js"), manifestContext, {filename:"src/config/course-manifest.js"});
const courseManifest = manifestContext.window.SalitaQuestCourseManifest;
if (!courseManifest?.courses) fail("The modular course manifest was not installed.");

for (const [htmlFile, courseId] of [["app.html", "tagalog"], ["bisaya.html", "cebuano"]]) {
  const html = read(htmlFile);
  requireMarkers(html, [
    "src/config/course-manifest.js?v=5.6.0",
    "src/app/course-bootstrap.js?v=5.6.0",
    `courseId: "${courseId}"`
  ], `${htmlFile} modular entry point`);

  const scripts = courseManifest.courses[courseId]?.scripts;
  if (!Array.isArray(scripts)) fail(`${courseId} has no script manifest.`);
  const scriptSource = scripts.join("\n");
  requireMarkers(scriptSource, [
    "ui-quality-fixes.js?v=5.4.21",
    "incorrect-order-feedback.js?v=5.4.21",
    "mastery-feedback.js?v=5.4.21",
    "lesson-side-launcher.js?v=5.4.21",
    "mobile-session-refinement.js?v=5.4.21"
  ], `${htmlFile} shared assets`);
  const masteryIndex = scripts.indexOf("mastery-feedback.js?v=5.4.21");
  const launcherIndex = scripts.indexOf("lesson-side-launcher.js?v=5.4.21");
  const mobileIndex = scripts.indexOf("mobile-session-refinement.js?v=5.4.21");
  if (!(masteryIndex >= 0 && launcherIndex > masteryIndex && mobileIndex > launcherIndex)) {
    fail(`${htmlFile} has an invalid mastery → launcher → mobile load order.`);
  }
}

const serviceWorker = read("service-worker.js");
requireMarkers(serviceWorker, [
  'const CACHE_NAME = "salita-quest-',
  '"./ui-quality-fixes.js"',
  '"./incorrect-order-feedback.js"',
  '"./src/adapters/exercise/incorrect-order-feedback-runtime-v1.js"',
  '"./src/features/exercise/incorrect-order-feedback.js"',
  '"./mastery-feedback.js"',
  '"./lesson-side-launcher.js"',
  '"./mobile-session-refinement.js"'
], "Offline shared UI release");

console.log("Validated answer feedback, sentence correction, three-day durable mastery, Daily/Quick launchers, pronunciation hidden during idle and pre-answer production, post-answer audio, modular course loaders, and offline delivery.");
