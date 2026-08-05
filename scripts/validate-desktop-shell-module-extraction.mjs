import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), "utf8");
const fail = message => { throw new Error(message); };
const requireMarkers = (source, markers, label) => markers.forEach(marker => {
  if (!source.includes(marker)) fail(`${label} is missing ${marker}`);
});

const compactLoaderPath = "compact-desktop-layout.js";
const compactModulePath = "src/features/interface/compact-desktop-layout.js";
const topbarLoaderPath = "clean-topbar.js";
const topbarModulePath = "src/features/interface/clean-topbar.js";
const compactLoader = read(compactLoaderPath);
const compactModule = read(compactModulePath);
const topbarLoader = read(topbarLoaderPath);
const topbarModule = read(topbarModulePath);
const manifestSource = read("src/config/course-manifest.js");
const refresh = read("mobile-refresh.html");
const worker = read("service-worker.js");

for (const [path, source] of [
  [compactLoaderPath, compactLoader],
  [compactModulePath, compactModule],
  [topbarLoaderPath, topbarLoader],
  [topbarModulePath, topbarModule],
  ["service-worker.js", worker]
]) new vm.Script(source, {filename:path});

requireMarkers(compactLoader, [
  'const TARGET = "./src/features/interface/compact-desktop-layout.js?v=5.4.21"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  'salitaCompatibilityLoader = "compact-desktop-layout"'
], "Compact desktop compatibility loader");
requireMarkers(topbarLoader, [
  'const TARGET = "./src/features/interface/clean-topbar.js?v=5.4.21"',
  "document.currentScript",
  "document.write",
  "script.async = false",
  'salitaCompatibilityLoader = "clean-topbar"'
], "Clean topbar compatibility loader");
if (compactLoader.includes("window.addEventListener") || compactLoader.includes("window.matchMedia")) {
  fail("The compact desktop compatibility loader must not own layout listeners");
}
if (topbarLoader.includes("renderMasteryRail =") || topbarLoader.includes("mastery-rail-shell")) {
  fail("The clean topbar compatibility loader must not own World Progress behavior");
}

requireMarkers(compactModule, [
  'const INSTALL_FLAG = "__salitaQuestCompactDesktopInstalled"',
  'const DESKTOP_QUERY = "(min-width: 1001px)"',
  'document.querySelector("#learnView .learn-layout")',
  'document.getElementById("lessonCard")',
  'document.getElementById("audioBtn")',
  'document.createComment("lesson-topline-home")',
  'document.createComment("lesson-audio-home")',
  'document.createComment("session-panel-home")',
  'document.body.classList.toggle("desktop-lesson-layout", desktop)',
  'media.addEventListener?.("change", applyLayout)',
  'window.addEventListener("resize", applyLayout, {passive:true})'
], "Extracted compact desktop module");
requireMarkers(topbarModule, [
  'const INSTALL_FLAG = "__salitaQuestCleanTopbarInstalled"',
  'const STYLESHEETS = [',
  'topbar-world-progress-hotfix.css?v=5.5.10.1',
  'mobile-world-progress-flow.css?v=5.5.10.2',
  'function structureMasteryShell()',
  'shell.dataset.compactMastery = "true"',
  'typeof totalLearningPoints === "function"',
  'const baseRenderMasteryRail = renderMasteryRail',
  'renderMasteryRail = function renderMasteryRailWithCompactCopy()'
], "Extracted clean topbar module");
if ((compactModule.match(/window\.addEventListener/g) || []).length !== 1) {
  fail("The compact desktop module must remain the sole owner of one window resize listener");
}
if ((topbarModule.match(/renderMasteryRail = function/g) || []).length !== 1) {
  fail("The clean topbar module must install exactly one renderMasteryRail wrapper");
}
for (const source of [compactModule, topbarModule]) {
  if (/\b(?:localStorage|sessionStorage)\b/.test(source)) fail("Desktop shell modules must not access learner storage");
}

const context = {window:{}};
vm.createContext(context);
vm.runInContext(manifestSource, context, {filename:"src/config/course-manifest.js"});
const courses = context.window.SalitaQuestCourseManifest?.courses;
const compactExpected = "src/features/interface/compact-desktop-layout.js?v=5.4.21";
const topbarExpected = "src/features/interface/clean-topbar.js?v=5.4.21";
if (!courses) fail("Course manifest was not installed");
for (const courseId of ["tagalog", "cebuano"]) {
  const scripts = courses[courseId]?.scripts || [];
  const feedbackAdapter = scripts.indexOf("src/adapters/exercise/incorrect-order-feedback-runtime-v1.js?v=5.4.21");
  const feedbackFeature = scripts.indexOf("src/features/exercise/incorrect-order-feedback.js?v=5.4.21");
  const feedback = scripts.indexOf("incorrect-order-feedback.js?v=5.4.21");
  const compact = scripts.indexOf(compactExpected);
  const topbar = scripts.indexOf(topbarExpected);
  const rail = scripts.indexOf("src/features/progression/even-progress-rail.js?v=5.4.21");
  if (!(feedback >= 0 && compact > feedback && topbar > compact && rail > topbar)) {
    fail(`${courseId} does not preserve feedback → compact layout → topbar → progress rail order`);
  }
  if (scripts.includes("compact-desktop-layout.js?v=5.4.21") || scripts.includes("clean-topbar.js?v=5.4.21")) {
    fail(`${courseId} still loads a root desktop-shell compatibility URL directly`);
  }
}

for (const path of [compactModulePath, topbarModulePath]) {
  if (!refresh.includes(path)) fail(`Mobile refresh does not fetch ${path}`);
}
requireMarkers(worker, [
  'const PREVIOUS_CACHE_NAME = "salita-quest-v5-6-19-long-term-badge-adapter-extraction-r72"',
  'const CACHE_NAME = "salita-quest-v5-6-20-avatar-case-profile-adapter-extraction-r73"',
  '"./compact-desktop-layout.js"',
  '"./src/features/interface/compact-desktop-layout.js"',
  '"./clean-topbar.js"',
  '"./src/features/interface/clean-topbar.js"'
], "Desktop shell offline contract");

console.log("Desktop shell extraction validation passed: two direct interface modules, two root compatibility loaders, preserved order and r57 offline delivery.");
